import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:web_socket_channel/web_socket_channel.dart';
import '../../features/pose_analysis/domain/entities/pose_metrics.dart';
import '../../features/pose_analysis/domain/entities/coaching_feedback.dart';
import '../../features/pose_analysis/domain/entities/coaching_context.dart';

class GeminiLiveService {
  late WebSocketChannel _channel;
  final String apiKey;

  /// Session history for conversational context
  final List<PoseMetrics> _sessionHistory = [];

  /// Stream controller for coaching feedback responses
  final _feedbackController = StreamController<CoachingFeedback>.broadcast();

  /// Stream of coaching feedback from Gemini
  Stream<CoachingFeedback> get feedbackStream => _feedbackController.stream;

  GeminiLiveService({required this.apiKey});

  Future<void> connect() async {
    _channel = WebSocketChannel.connect(
      Uri.parse('wss://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-live/streamGenerateContent?key=$apiKey'),
    );

    // Send setup configuration
    final config = {
      'setup': {
        'model': 'gemini-2.5-flash-live',
        'generationConfig': {
          'responseModalities': ['AUDIO', 'TEXT'],
          'temperature': 0.7,
        },
        'systemInstruction': '''
You are an expert fitness coach providing real-time feedback on exercise form.

Your role:
- Analyze pose data (joint angles, landmark positions, confidence scores)
- Provide clear, actionable feedback on form corrections
- Offer encouragement for good form
- Warn about potential injury risks
- Keep feedback concise and specific

Focus areas:
- Body alignment and positioning
- Movement quality and range of motion
- Safety and injury prevention
- Progressive improvement over time

Tone: Professional, supportive, and motivating. Adapt complexity to user's fitness level.
        ''',
        'tools': [
          {
            'functionDeclarations': [
              {
                'name': 'analyzePoseData',
                'description': 'Analyze detailed pose metrics including joint angles, landmark positions, and movement quality',
                'parameters': {
                  'type': 'object',
                  'properties': {
                    'exerciseType': {
                      'type': 'string',
                      'description': 'Type of exercise being performed (e.g., bicep_curl, squat)'
                    },
                    'repCount': {
                      'type': 'integer',
                      'description': 'Current repetition number'
                    },
                    'formScore': {
                      'type': 'number',
                      'description': 'Overall form quality score from 0-100'
                    },
                    'angles': {
                      'type': 'object',
                      'description': 'Map of joint angles in degrees'
                    },
                    'confidence': {
                      'type': 'number',
                      'description': 'Pose detection confidence score 0.0-1.0'
                    },
                    'currentPhase': {
                      'type': 'string',
                      'description': 'Current exercise phase (up, down, hold, rest, none)'
                    }
                  },
                  'required': ['exerciseType', 'repCount', 'formScore', 'angles']
                }
              },
              {
                'name': 'updateWorkoutPlan',
                'description': 'Record workout progress and update training plan recommendations',
                'parameters': {
                  'type': 'object',
                  'properties': {
                    'exerciseType': {
                      'type': 'string',
                      'description': 'Exercise completed'
                    },
                    'totalReps': {
                      'type': 'integer',
                      'description': 'Total reps completed in set'
                    },
                    'averageFormScore': {
                      'type': 'number',
                      'description': 'Average form score across the set'
                    },
                    'setNumber': {
                      'type': 'integer',
                      'description': 'Set number just completed'
                    },
                    'notes': {
                      'type': 'string',
                      'description': 'Additional observations or recommendations'
                    }
                  },
                  'required': ['exerciseType', 'totalReps', 'averageFormScore']
                }
              }
            ]
          }
        ]
      }
    };

    _channel.sink.add(jsonEncode(config));

    // Listen for responses
    _channel.stream.listen((data) {
      final response = jsonDecode(data);
      _handleGeminiResponse(response);
    });
  }

  void streamVideoFrame(Uint8List frameData) {
    final message = {
      'realtimeInput': {
        'mediaChunks': [
          {
            'mimeType': 'image/jpeg',
            'data': base64Encode(frameData)
          }
        ]
      }
    };
    _channel.sink.add(jsonEncode(message));
  }

  /// Request coaching feedback based on current pose and context
  Future<CoachingFeedback> requestCoaching({
    required PoseMetrics currentPose,
    required List<PoseMetrics> recentHistory,
    required CoachingContext context,
  }) async {
    // Add to session history
    _sessionHistory.add(currentPose);
    if (_sessionHistory.length > 50) {
      _sessionHistory.removeAt(0); // Keep last 50 frames for context
    }

    // Prepare structured data format
    final poseData = {
      'current': {
        'exerciseType': currentPose.exerciseType,
        'repCount': currentPose.repCount,
        'formScore': currentPose.formScore,
        'angles': currentPose.angles,
        'confidence': currentPose.confidence,
        'currentPhase': currentPose.currentPhase.toString().split('.').last,
        'timestamp': currentPose.timestamp.toIso8601String(),
      },
      'recentHistory': recentHistory.map((pose) => {
        'repCount': pose.repCount,
        'formScore': pose.formScore,
        'phase': pose.currentPhase.toString().split('.').last,
        'timestamp': pose.timestamp.toIso8601String(),
      }).toList(),
      'context': context.toJson(),
    };

    // Send via clientContent message format
    final message = {
      'clientContent': {
        'turns': [
          {
            'role': 'user',
            'parts': [
              {
                'text': _formatCoachingRequest(context, currentPose),
              },
              {
                'functionCall': {
                  'name': 'analyzePoseData',
                  'args': poseData['current'],
                }
              }
            ]
          }
        ],
        'turnComplete': true,
      }
    };

    _channel.sink.add(jsonEncode(message));

    // Wait for response (handled in stream listener)
    final completer = Completer<CoachingFeedback>();
    StreamSubscription? subscription;

    subscription = _feedbackController.stream.listen((feedback) {
      if (!completer.isCompleted) {
        completer.complete(feedback);
        subscription?.cancel();
      }
    });

    return completer.future;
  }

  /// Send contextual frame with pose overlay for visual context
  /// Only call for significant moments (errors, rep completions, etc.)
  void sendContextualFrame({
    required Uint8List frameData,
    required String context,
  }) {
    final message = {
      'realtimeInput': {
        'mediaChunks': [
          {
            'mimeType': 'image/jpeg',
            'data': base64Encode(frameData),
          }
        ],
      },
      'clientContent': {
        'turns': [
          {
            'role': 'user',
            'parts': [
              {
                'text': context,
              }
            ]
          }
        ],
        'turnComplete': true,
      }
    };
    _channel.sink.add(jsonEncode(message));
  }

  /// Format a natural language coaching request based on context
  String _formatCoachingRequest(CoachingContext context, PoseMetrics pose) {
    switch (context.contextType) {
      case CoachingContextType.repCompleted:
        return 'I just completed rep ${pose.repCount} of ${pose.exerciseType} with a form score of ${pose.formScore.toStringAsFixed(1)}. Please provide feedback.';

      case CoachingContextType.formError:
        final errors = context.allErrors?.map((e) => e.toString()).join(', ') ?? 'form issues';
        return 'I detected $errors during my ${pose.exerciseType}. How can I correct this?';

      case CoachingContextType.setFinished:
        final totalReps = context.metadata['totalReps'] ?? pose.repCount;
        final avgScore = context.metadata['averageFormScore'] ?? pose.formScore;
        return 'I completed a set of $totalReps ${pose.exerciseType} reps with an average form score of ${avgScore.toStringAsFixed(1)}. How did I do?';

      case CoachingContextType.userRequest:
        final query = context.metadata['userQuery'] ?? 'feedback';
        return '$query (currently doing ${pose.exerciseType}, rep ${pose.repCount})';
    }
  }

  /// Clear session history
  void clearHistory() {
    _sessionHistory.clear();
  }

  /// Get current session history
  List<PoseMetrics> get sessionHistory => List.unmodifiable(_sessionHistory);

  void _handleGeminiResponse(Map<String, dynamic> response) {
    try {
      // Parse serverContent for text and audio
      if (response.containsKey('serverContent')) {
        final serverContent = response['serverContent'] as Map<String, dynamic>;

        // Handle model turn with parts
        if (serverContent.containsKey('modelTurn')) {
          final modelTurn = serverContent['modelTurn'] as Map<String, dynamic>;
          final parts = modelTurn['parts'] as List<dynamic>? ?? [];

          String? feedbackText;
          List<String> audioChunks = [];

          for (final part in parts) {
            final partMap = part as Map<String, dynamic>;

            // Extract text content
            if (partMap.containsKey('text')) {
              feedbackText = partMap['text'] as String;
            }

            // Extract audio chunks
            if (partMap.containsKey('inlineData')) {
              final inlineData = partMap['inlineData'] as Map<String, dynamic>;
              if (inlineData['mimeType'] == 'audio/pcm' ||
                  inlineData['mimeType']?.toString().startsWith('audio/') == true) {
                audioChunks.add(inlineData['data'] as String);
              }
            }

            // Handle tool calls (if needed for logging or metrics)
            if (partMap.containsKey('functionCall')) {
              final functionCall = partMap['functionCall'] as Map<String, dynamic>;
              _handleToolCall(functionCall);
            }
          }

          // Create CoachingFeedback object
          if (feedbackText != null) {
            final feedback = CoachingFeedback(
              message: feedbackText,
              audioData: audioChunks.isNotEmpty ? _combineAudioChunks(audioChunks) : null,
              type: _inferFeedbackType(feedbackText),
              timestamp: DateTime.now(),
            );

            _feedbackController.add(feedback);
          }
        }
      }
    } catch (e) {
      print('Error handling Gemini response: $e');
    }
  }

  /// Handle tool calls from Gemini
  void _handleToolCall(Map<String, dynamic> functionCall) {
    final functionName = functionCall['name'] as String;
    final args = functionCall['args'] as Map<String, dynamic>? ?? {};

    // Log tool calls for debugging/metrics
    print('Gemini tool call: $functionName with args: $args');

    // Tool calls are handled by Gemini internally; we just observe them
    // In a full implementation, you might want to log these or update UI
  }

  /// Combine multiple base64 audio chunks into single audio data
  Uint8List? _combineAudioChunks(List<String> chunks) {
    if (chunks.isEmpty) return null;

    try {
      final allBytes = <int>[];
      for (final chunk in chunks) {
        final bytes = base64Decode(chunk);
        allBytes.addAll(bytes);
      }
      return Uint8List.fromList(allBytes);
    } catch (e) {
      print('Error combining audio chunks: $e');
      return null;
    }
  }

  /// Infer feedback type from message content
  FeedbackType _inferFeedbackType(String message) {
    final lowerMessage = message.toLowerCase();

    // Check for warnings
    if (lowerMessage.contains('warning') ||
        lowerMessage.contains('danger') ||
        lowerMessage.contains('injury') ||
        lowerMessage.contains('careful') ||
        lowerMessage.contains('stop')) {
      return FeedbackType.warning;
    }

    // Check for corrections
    if (lowerMessage.contains('fix') ||
        lowerMessage.contains('adjust') ||
        lowerMessage.contains('improve') ||
        lowerMessage.contains('should') ||
        lowerMessage.contains('try') ||
        lowerMessage.contains('lower') ||
        lowerMessage.contains('higher') ||
        lowerMessage.contains('straighter')) {
      return FeedbackType.correction;
    }

    // Check for encouragement
    if (lowerMessage.contains('great') ||
        lowerMessage.contains('excellent') ||
        lowerMessage.contains('good') ||
        lowerMessage.contains('nice') ||
        lowerMessage.contains('perfect') ||
        lowerMessage.contains('well done') ||
        lowerMessage.contains('keep it up')) {
      return FeedbackType.encouragement;
    }

    // Default to info
    return FeedbackType.info;
  }

  void dispose() {
    _feedbackController.close();
    _channel.sink.close();
  }
}
