import 'dart:typed_data';

class MemoryEfficientVideoHandler {
  // Reuse buffers
  final _frameBufferPool = <Uint8List>[];

  Uint8List getBuffer(int size) {
    if (_frameBufferPool.isNotEmpty) {
      return _frameBufferPool.removeLast();
    }
    return Uint8List(size);
  }

  void returnBuffer(Uint8List buffer) {
    buffer.fillRange(0, buffer.length, 0);
    _frameBufferPool.add(buffer);
  }
}
