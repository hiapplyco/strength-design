import 'dart:typed_data';

/// Types of coaching feedback that can be provided to the user.
enum FeedbackType {
  /// Form correction feedback addressing specific issues
  correction,

  /// Positive reinforcement and encouragement
  encouragement,

  /// Warning about potential injury risk
  warning,

  /// General informational message about the exercise
  info,
}

/// Represents coaching feedback from Gemini AI model.
///
/// This entity encapsulates the response from the Gemini API, including
/// text feedback, optional audio synthesis, and metadata about the feedback type.
/// It's used to deliver real-time coaching to the user during exercise.
class CoachingFeedback {
  /// Text content of the feedback message
  /// Example: "Great form! Keep your back straight and lower slower."
  final String message;

  /// Optional audio data for text-to-speech synthesis
  /// If null, only text feedback will be displayed
  final Uint8List? audioData;

  /// Type/category of the feedback
  final FeedbackType type;

  /// Timestamp when this feedback was generated
  final DateTime timestamp;

  CoachingFeedback({
    required this.message,
    this.audioData,
    required this.type,
    required this.timestamp,
  });

  /// Convert to JSON-serializable map
  /// Note: audioData is not serialized (too large for JSON)
  Map<String, dynamic> toJson() {
    return {
      'message': message,
      'type': type.toString().split('.').last,
      'timestamp': timestamp.toIso8601String(),
      'hasAudio': audioData != null,
    };
  }

  /// Create from JSON map
  /// Note: audioData must be restored separately from binary storage
  factory CoachingFeedback.fromJson(Map<String, dynamic> json) {
    return CoachingFeedback(
      message: json['message'] as String? ?? '',
      audioData: null, // Restore from separate binary storage if needed
      type: FeedbackType.values.firstWhere(
        (type) => type.toString().split('.').last == (json['type'] as String? ?? 'info'),
        orElse: () => FeedbackType.info,
      ),
      timestamp: DateTime.parse(
        json['timestamp'] as String? ?? DateTime.now().toIso8601String(),
      ),
    );
  }

  /// Create a copy with optional field replacements
  CoachingFeedback copyWith({
    String? message,
    Uint8List? audioData,
    FeedbackType? type,
    DateTime? timestamp,
  }) {
    return CoachingFeedback(
      message: message ?? this.message,
      audioData: audioData ?? this.audioData,
      type: type ?? this.type,
      timestamp: timestamp ?? this.timestamp,
    );
  }

  /// Convenience method to check if audio is available
  bool get hasAudio => audioData != null && audioData!.isNotEmpty;

  /// Returns the size of audio data in kilobytes
  double get audioSizeKB => hasAudio ? audioData!.length / 1024 : 0.0;

  @override
  String toString() => 'CoachingFeedback(type: $type, message: "${message.substring(0, (message.length > 50 ? 50 : message.length))}...", '
      'hasAudio: $hasAudio, timestamp: $timestamp)';
}

/// Extension providing utilities for FeedbackType
extension FeedbackTypeX on FeedbackType {
  /// Returns a human-readable display string
  String get displayName {
    return switch (this) {
      FeedbackType.correction => 'Form Correction',
      FeedbackType.encouragement => 'Encouragement',
      FeedbackType.warning => 'Warning',
      FeedbackType.info => 'Information',
    };
  }

  /// Returns color code representation for UI (hex without '#')
  String get colorCode {
    return switch (this) {
      FeedbackType.correction => '2196F3', // Blue
      FeedbackType.encouragement => '4CAF50', // Green
      FeedbackType.warning => 'FF9800', // Orange
      FeedbackType.info => '9C27B0', // Purple
    };
  }

  /// Returns an emoji or icon identifier
  String get icon {
    return switch (this) {
      FeedbackType.correction => 'edit',
      FeedbackType.encouragement => 'thumb_up',
      FeedbackType.warning => 'warning',
      FeedbackType.info => 'info',
    };
  }

  /// Returns true if this feedback requires immediate user attention
  bool get isUrgent => this == FeedbackType.warning || this == FeedbackType.correction;
}
