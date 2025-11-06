import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:strength_design/src/core/services/ai_service.dart';

const geminiApiKey = String.fromEnvironment('GEMINI_API_KEY');

final aiServiceProvider = Provider<AiService>((ref) {
  if (geminiApiKey.isEmpty) {
    throw Exception('GEMINI_API_KEY is not set.');
  }
  return AiService(geminiApiKey);
});
