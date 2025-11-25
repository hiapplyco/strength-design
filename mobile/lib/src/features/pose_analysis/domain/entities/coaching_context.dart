import 'form_error.dart';
import 'pose_metrics.dart';

/// Context types that trigger Gemini coaching feedback generation.
enum CoachingContextType {
  /// A rep has been completed successfully
  repCompleted,

  /// Form error(s) detected during movement
  formError,

  /// Full set has been finished
  setFinished,

  /// User explicitly requested feedback
  userRequest,
}

/// Provides context information to the Gemini AI for generating appropriate coaching feedback.
///
/// This entity packages all relevant information about the current state and
/// triggers for coaching feedback, allowing Gemini to make informed decisions
/// about what guidance to provide to the user.
class CoachingContext {
  /// Type of event that triggered coaching request
  final CoachingContextType contextType;

  /// Additional contextual metadata as key-value pairs
  /// Common keys:
  /// - 'repCount': Current rep number (int)
  /// - 'setCount': Current set number (int)
  /// - 'formErrors': List of detected form errors
  /// - 'poseMetrics': Current pose metrics
  /// - 'previousReps': History of recent reps (List of PoseMetrics)
  /// - 'exerciseType': Name of the exercise being performed (String)
  /// - 'userLevel': Fitness level hint for coaching tone (String: beginner/intermediate/advanced)
  /// - 'focusArea': Area user wants to improve (String, optional)
  final Map<String, dynamic> metadata;

  CoachingContext({
    required this.contextType,
    required this.metadata,
  });

  /// Convert to JSON-serializable map
  Map<String, dynamic> toJson() {
    return {
      'contextType': contextType.toString().split('.').last,
      'metadata': metadata,
    };
  }

  /// Create from JSON map
  factory CoachingContext.fromJson(Map<String, dynamic> json) {
    return CoachingContext(
      contextType: CoachingContextType.values.firstWhere(
        (type) => type.toString().split('.').last == (json['contextType'] as String? ?? 'userRequest'),
        orElse: () => CoachingContextType.userRequest,
      ),
      metadata: Map<String, dynamic>.from(json['metadata'] as Map<String, dynamic>? ?? {}),
    );
  }

  /// Create a copy with optional field replacements
  CoachingContext copyWith({
    CoachingContextType? contextType,
    Map<String, dynamic>? metadata,
  }) {
    return CoachingContext(
      contextType: contextType ?? this.contextType,
      metadata: metadata ?? this.metadata,
    );
  }

  /// Convenience method to create a rep completion context
  static CoachingContext repCompleted({
    required int repCount,
    required int setCount,
    required String exerciseType,
    required PoseMetrics metrics,
    required double formScore,
    Map<String, dynamic>? additionalData,
  }) {
    final metadata = {
      'repCount': repCount,
      'setCount': setCount,
      'exerciseType': exerciseType,
      'formScore': formScore,
      'poseMetrics': metrics,
      ...?additionalData,
    };

    return CoachingContext(
      contextType: CoachingContextType.repCompleted,
      metadata: metadata,
    );
  }

  /// Convenience method to create a form error context
  static CoachingContext withFormError({
    required String exerciseType,
    required FormError error,
    required List<FormError>? allErrors,
    required PoseMetrics metrics,
    Map<String, dynamic>? additionalData,
  }) {
    final metadata = {
      'exerciseType': exerciseType,
      'formError': error,
      'allErrors': allErrors ?? [error],
      'poseMetrics': metrics,
      ...?additionalData,
    };

    return CoachingContext(
      contextType: CoachingContextType.formError,
      metadata: metadata,
    );
  }

  /// Convenience method to create a set completion context
  static CoachingContext setFinished({
    required String exerciseType,
    required int setCount,
    required int totalReps,
    required double averageFormScore,
    required List<PoseMetrics>? repsInSet,
    Map<String, dynamic>? additionalData,
  }) {
    final metadata = {
      'exerciseType': exerciseType,
      'setCount': setCount,
      'totalReps': totalReps,
      'averageFormScore': averageFormScore,
      'repsInSet': repsInSet ?? [],
      ...?additionalData,
    };

    return CoachingContext(
      contextType: CoachingContextType.setFinished,
      metadata: metadata,
    );
  }

  /// Convenience method to create a user request context
  static CoachingContext userRequest({
    required String exerciseType,
    required String userQuery,
    required PoseMetrics? currentMetrics,
    Map<String, dynamic>? additionalData,
  }) {
    final metadata = {
      'exerciseType': exerciseType,
      'userQuery': userQuery,
      if (currentMetrics != null) 'poseMetrics': currentMetrics,
      ...?additionalData,
    };

    return CoachingContext(
      contextType: CoachingContextType.userRequest,
      metadata: metadata,
    );
  }

  /// Get rep count from metadata, if available
  int? get repCount => metadata['repCount'] as int?;

  /// Get set count from metadata, if available
  int? get setCount => metadata['setCount'] as int?;

  /// Get exercise type from metadata, if available
  String? get exerciseType => metadata['exerciseType'] as String?;

  /// Get form score from metadata, if available
  double? get formScore => (metadata['formScore'] as num?)?.toDouble();

  /// Get pose metrics from metadata, if available
  PoseMetrics? get poseMetrics => metadata['poseMetrics'] as PoseMetrics?;

  /// Get detected form error from metadata, if available
  FormError? get formError => metadata['formError'] as FormError?;

  /// Get all form errors from metadata, if available
  List<FormError>? get allErrors =>
      (metadata['allErrors'] as List?)?.cast<FormError>();

  /// Get user's fitness level hint from metadata, if available
  String? get userLevel => metadata['userLevel'] as String?;

  @override
  String toString() => 'CoachingContext(type: $contextType, '
      'exercise: $exerciseType, repCount: $repCount, '
      'setCount: $setCount)';
}

/// Extension providing utilities for CoachingContextType
extension CoachingContextTypeX on CoachingContextType {
  /// Returns a human-readable display string
  String get displayName {
    return switch (this) {
      CoachingContextType.repCompleted => 'Rep Completed',
      CoachingContextType.formError => 'Form Error',
      CoachingContextType.setFinished => 'Set Finished',
      CoachingContextType.userRequest => 'User Request',
    };
  }

  /// Returns true if this context is triggered automatically by the system
  bool get isAutomatic =>
      this == CoachingContextType.repCompleted ||
      this == CoachingContextType.formError ||
      this == CoachingContextType.setFinished;

  /// Returns true if this context is user-initiated
  bool get isUserInitiated => this == CoachingContextType.userRequest;

  /// Returns true if this context is error-related
  bool get isErrorRelated => this == CoachingContextType.formError;
}
