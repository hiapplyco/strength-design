import 'dart:typed_data';

/// Image preprocessing utilities for MoveNet pose detection
///
/// Handles resizing, normalization, and format conversion for TensorFlow Lite
class ImagePreprocessing {
  /// Resize and normalize image for MoveNet Thunder input
  ///
  /// MoveNet Thunder expects:
  /// - Input size: 256x256
  /// - Format: RGB (3 channels)
  /// - Range: 0.0 to 1.0 (normalized)
  ///
  /// Returns a 4D tensor: [1, 256, 256, 3]
  static List<List<List<List<double>>>> preprocessForMoveNet({
    required Uint8List rgbaBytes,
    required int originalWidth,
    required int originalHeight,
    int targetSize = 256,
  }) {
    // Create output tensor [1, 256, 256, 3]
    final tensor = List.generate(
      1,
      (_) => List.generate(
        targetSize,
        (_) => List.generate(
          targetSize,
          (_) => List.filled(3, 0.0),
        ),
      ),
    );

    // Calculate scaling factors
    final scaleX = originalWidth / targetSize;
    final scaleY = originalHeight / targetSize;

    // Simple nearest-neighbor resize with normalization
    for (int y = 0; y < targetSize; y++) {
      for (int x = 0; x < targetSize; x++) {
        // Map target coordinates to source coordinates
        final srcX = (x * scaleX).floor().clamp(0, originalWidth - 1);
        final srcY = (y * scaleY).floor().clamp(0, originalHeight - 1);

        // Get pixel from source (RGBA format: 4 bytes per pixel)
        final pixelIndex = (srcY * originalWidth + srcX) * 4;

        // Extract RGB values (skip alpha channel)
        final r = rgbaBytes[pixelIndex];
        final g = rgbaBytes[pixelIndex + 1];
        final b = rgbaBytes[pixelIndex + 2];

        // Normalize to [0.0, 1.0] range
        tensor[0][y][x][0] = r / 255.0;
        tensor[0][y][x][1] = g / 255.0;
        tensor[0][y][x][2] = b / 255.0;
      }
    }

    return tensor;
  }

  /// Bilinear resize for better quality (slower than nearest-neighbor)
  ///
  /// Use this if you need higher quality resizing at the cost of performance.
  static List<List<List<List<double>>>> preprocessForMoveNetBilinear({
    required Uint8List rgbaBytes,
    required int originalWidth,
    required int originalHeight,
    int targetSize = 256,
  }) {
    // Create output tensor [1, 256, 256, 3]
    final tensor = List.generate(
      1,
      (_) => List.generate(
        targetSize,
        (_) => List.generate(
          targetSize,
          (_) => List.filled(3, 0.0),
        ),
      ),
    );

    final scaleX = originalWidth / targetSize;
    final scaleY = originalHeight / targetSize;

    for (int y = 0; y < targetSize; y++) {
      for (int x = 0; x < targetSize; x++) {
        // Map to source coordinates (fractional)
        final srcX = x * scaleX;
        final srcY = y * scaleY;

        // Get surrounding pixels for bilinear interpolation
        final x1 = srcX.floor().clamp(0, originalWidth - 1);
        final x2 = (srcX.ceil()).clamp(0, originalWidth - 1);
        final y1 = srcY.floor().clamp(0, originalHeight - 1);
        final y2 = (srcY.ceil()).clamp(0, originalHeight - 1);

        // Interpolation weights
        final wx = srcX - x1;
        final wy = srcY - y1;

        // Get four corner pixels
        final p11 = _getPixel(rgbaBytes, x1, y1, originalWidth);
        final p12 = _getPixel(rgbaBytes, x1, y2, originalWidth);
        final p21 = _getPixel(rgbaBytes, x2, y1, originalWidth);
        final p22 = _getPixel(rgbaBytes, x2, y2, originalWidth);

        // Bilinear interpolation for each channel
        for (int c = 0; c < 3; c++) {
          final top = p11[c] * (1 - wx) + p21[c] * wx;
          final bottom = p12[c] * (1 - wx) + p22[c] * wx;
          final value = top * (1 - wy) + bottom * wy;

          // Normalize to [0.0, 1.0]
          tensor[0][y][x][c] = value / 255.0;
        }
      }
    }

    return tensor;
  }

  /// Get RGB pixel values at specific coordinates
  static List<int> _getPixel(
    Uint8List rgbaBytes,
    int x,
    int y,
    int width,
  ) {
    final pixelIndex = (y * width + x) * 4;
    return [
      rgbaBytes[pixelIndex], // R
      rgbaBytes[pixelIndex + 1], // G
      rgbaBytes[pixelIndex + 2], // B
    ];
  }

  /// Convert YUV420 to RGBA (for camera frames)
  ///
  /// Many mobile cameras provide YUV420 format. This converts it to RGBA
  /// for further processing.
  static Uint8List yuv420ToRgba({
    required Uint8List yuvBytes,
    required int width,
    required int height,
  }) {
    final rgbaBytes = Uint8List(width * height * 4);
    final uvPixelStride = 1;
    final uvRowStride = width ~/ 2;
    final uvIndex = width * height;

    for (int y = 0; y < height; y++) {
      for (int x = 0; x < width; x++) {
        final yIndex = y * width + x;
        final uvOffset = uvIndex + (y ~/ 2) * uvRowStride + (x ~/ 2) * uvPixelStride;

        final yValue = yuvBytes[yIndex] & 0xff;
        final uValue = (yuvBytes[uvOffset] & 0xff) - 128;
        final vValue = (yuvBytes[uvOffset + uvRowStride * height ~/ 2] & 0xff) - 128;

        // YUV to RGB conversion
        final r = (yValue + 1.370705 * vValue).clamp(0, 255).toInt();
        final g = (yValue - 0.337633 * uValue - 0.698001 * vValue).clamp(0, 255).toInt();
        final b = (yValue + 1.732446 * uValue).clamp(0, 255).toInt();

        final rgbaIndex = yIndex * 4;
        rgbaBytes[rgbaIndex] = r;
        rgbaBytes[rgbaIndex + 1] = g;
        rgbaBytes[rgbaIndex + 2] = b;
        rgbaBytes[rgbaIndex + 3] = 255; // Alpha
      }
    }

    return rgbaBytes;
  }

  /// Rotate image bytes by specified degrees (0, 90, 180, 270)
  ///
  /// Used to handle camera orientation changes
  static Uint8List rotateRgba({
    required Uint8List rgbaBytes,
    required int width,
    required int height,
    required int degrees,
  }) {
    if (degrees % 90 != 0) {
      throw ArgumentError('Rotation must be a multiple of 90 degrees');
    }

    final normalizedDegrees = degrees % 360;
    if (normalizedDegrees == 0) return rgbaBytes;

    final rotated = Uint8List(rgbaBytes.length);
    final pixelCount = width * height;

    for (int i = 0; i < pixelCount; i++) {
      final x = i % width;
      final y = i ~/ width;

      int newX, newY, newWidth;

      switch (normalizedDegrees) {
        case 90:
          newX = height - 1 - y;
          newY = x;
          newWidth = height;
          break;
        case 180:
          newX = width - 1 - x;
          newY = height - 1 - y;
          newWidth = width;
          break;
        case 270:
          newX = y;
          newY = width - 1 - x;
          newWidth = height;
          break;
        default:
          newX = x;
          newY = y;
          newWidth = width;
      }

      final oldIndex = i * 4;
      final newIndex = (newY * newWidth + newX) * 4;

      rotated[newIndex] = rgbaBytes[oldIndex];
      rotated[newIndex + 1] = rgbaBytes[oldIndex + 1];
      rotated[newIndex + 2] = rgbaBytes[oldIndex + 2];
      rotated[newIndex + 3] = rgbaBytes[oldIndex + 3];
    }

    return rotated;
  }
}
