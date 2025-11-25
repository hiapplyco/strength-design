#!/bin/bash
# MoveNet Thunder Model Download Script
# This script downloads the official MoveNet Thunder TensorFlow Lite model

set -e

MODEL_DIR="$(dirname "$0")"
MODEL_FILE="$MODEL_DIR/movenet_thunder.tflite"

echo "Downloading MoveNet Thunder TensorFlow Lite model..."
echo "Source: https://tfhub.dev/google/lite-model/movenet/singlepose/thunder/tflite/float16/4"

# Method 1: Direct download using TensorFlow Hub's export endpoint
# The model can be accessed through the TensorFlow Hub serving endpoint
curl -L "https://www.kaggle.com/models/download/google/movenet/tfLite/singlepose-thunder-tflite-float16/1" \
  -o "$MODEL_FILE" 2>/dev/null || \
  {
    echo "Download failed. Please manually download from:"
    echo "https://tfhub.dev/google/lite-model/movenet/singlepose/thunder/tflite/float16/4"
    echo ""
    echo "Alternative sources:"
    echo "1. Kaggle Models: https://www.kaggle.com/models/google/movenet"
    echo "2. MediaPipe: https://mediapipe.dev/solutions/pose"
    exit 1
  }

if [ -f "$MODEL_FILE" ]; then
  SIZE=$(stat -f%z "$MODEL_FILE" 2>/dev/null || stat -c%s "$MODEL_FILE" 2>/dev/null)
  echo "✓ Model downloaded successfully"
  echo "  File: $MODEL_FILE"
  echo "  Size: $(printf "%.2f MB\n" $((SIZE/1024))/1024)"
else
  echo "✗ Download failed"
  exit 1
fi
