/// Severity levels for form errors detected during exercise execution.
enum ErrorSeverity {
  /// Critical form error that could cause injury
  dangerous,

  /// Moderate form issue that reduces exercise effectiveness
  moderate,

  /// Minor form issue that is good to know about
  minor,
}

/// Represents a single form error detected during pose analysis.
///
/// This entity captures details about form issues, their severity, and
/// suggested corrections, allowing the system to provide targeted coaching
/// feedback about specific movement problems.
class FormError {
  /// Type of form error (e.g., 'excessive_elbow_flare', 'incomplete_range_of_motion')
  final String errorType;

  /// Severity level of this error
  final ErrorSeverity severity;

  /// Body part or joint affected (e.g., 'left_shoulder', 'right_knee')
  final String bodyPart;

  /// Suggested correction text for the user
  /// Example: "Keep your elbows closer to your body"
  final String suggestedCorrection;

  /// The actual value detected (e.g., elbow angle measurement)
  final double detectedValue;

  /// Ideal range for this metric (e.g., "85-95 degrees")
  final String idealRange;

  FormError({
    required this.errorType,
    required this.severity,
    required this.bodyPart,
    required this.suggestedCorrection,
    required this.detectedValue,
    required this.idealRange,
  });

  /// Convert to JSON-serializable map
  Map<String, dynamic> toJson() {
    return {
      'errorType': errorType,
      'severity': severity.toString().split('.').last,
      'bodyPart': bodyPart,
      'suggestedCorrection': suggestedCorrection,
      'detectedValue': detectedValue,
      'idealRange': idealRange,
    };
  }

  /// Create from JSON map
  factory FormError.fromJson(Map<String, dynamic> json) {
    return FormError(
      errorType: json['errorType'] as String? ?? '',
      severity: ErrorSeverity.values.firstWhere(
        (sev) => sev.toString().split('.').last == (json['severity'] as String? ?? 'minor'),
        orElse: () => ErrorSeverity.minor,
      ),
      bodyPart: json['bodyPart'] as String? ?? '',
      suggestedCorrection: json['suggestedCorrection'] as String? ?? '',
      detectedValue: (json['detectedValue'] as num?)?.toDouble() ?? 0.0,
      idealRange: json['idealRange'] as String? ?? '',
    );
  }

  /// Create a copy with optional field replacements
  FormError copyWith({
    String? errorType,
    ErrorSeverity? severity,
    String? bodyPart,
    String? suggestedCorrection,
    double? detectedValue,
    String? idealRange,
  }) {
    return FormError(
      errorType: errorType ?? this.errorType,
      severity: severity ?? this.severity,
      bodyPart: bodyPart ?? this.bodyPart,
      suggestedCorrection: suggestedCorrection ?? this.suggestedCorrection,
      detectedValue: detectedValue ?? this.detectedValue,
      idealRange: idealRange ?? this.idealRange,
    );
  }

  @override
  String toString() => 'FormError($errorType on $bodyPart, '
      'severity: ${severity.toString().split('.').last}, '
      'detected: $detectedValue, ideal: $idealRange)';
}

/// Extension providing utilities for ErrorSeverity
extension ErrorSeverityX on ErrorSeverity {
  /// Returns a human-readable display string
  String get displayName {
    return switch (this) {
      ErrorSeverity.dangerous => 'Critical',
      ErrorSeverity.moderate => 'Moderate',
      ErrorSeverity.minor => 'Minor',
    };
  }

  /// Returns color code representation (useful for UI)
  /// Returns hex code without '#' prefix
  String get colorCode {
    return switch (this) {
      ErrorSeverity.dangerous => 'FF5252', // Red
      ErrorSeverity.moderate => 'FFC107', // Amber
      ErrorSeverity.minor => '4CAF50', // Green
    };
  }

  /// Returns numeric priority (higher = more urgent)
  int get priority {
    return switch (this) {
      ErrorSeverity.dangerous => 3,
      ErrorSeverity.moderate => 2,
      ErrorSeverity.minor => 1,
    };
  }
}
