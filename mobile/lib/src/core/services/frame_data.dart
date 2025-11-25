import 'dart:typed_data';

/// Simple frame data wrapper to replace ML Kit's InputImage
///
/// Contains the raw image bytes and metadata needed for pose detection.
/// Designed to work with camera frames and image files.
class FrameData {
  /// Raw image bytes (typically from camera or file)
  final Uint8List bytes;

  /// Original image width in pixels
  final int width;

  /// Original image height in pixels
  final int height;

  /// Image rotation in degrees (0, 90, 180, 270)
  /// Used for camera orientation handling
  final int rotation;

  /// Image format (e.g., 'yuv420', 'rgba', 'bgra', 'nv21')
  final String format;

  const FrameData({
    required this.bytes,
    required this.width,
    required this.height,
    this.rotation = 0,
    this.format = 'rgba',
  });

  /// Create FrameData from RGBA bytes
  factory FrameData.fromRgba({
    required Uint8List bytes,
    required int width,
    required int height,
    int rotation = 0,
  }) {
    return FrameData(
      bytes: bytes,
      width: width,
      height: height,
      rotation: rotation,
      format: 'rgba',
    );
  }

  /// Create FrameData from YUV420 camera frame
  factory FrameData.fromYuv420({
    required Uint8List bytes,
    required int width,
    required int height,
    int rotation = 0,
  }) {
    return FrameData(
      bytes: bytes,
      width: width,
      height: height,
      rotation: rotation,
      format: 'yuv420',
    );
  }

  @override
  String toString() => 'FrameData(${width}x$height, format: $format, '
      'rotation: $rotation, bytes: ${bytes.length})';
}
