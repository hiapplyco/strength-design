import 'package:flutter/foundation.dart';
import 'package:google_generative_ai/google_generative_ai.dart';

class AiService {
  final GenerativeModel _model;

  AiService(String apiKey)
      : _model = GenerativeModel(model: 'gemini-pro', apiKey: apiKey);

  Future<String> generateWorkout(String prompt) async {
    try {
      final content = [Content.text(prompt)];
      final response = await _model.generateContent(content);
      return response.text ?? '';
    } catch (e) {
      debugPrint(e.toString());
      return 'Error generating workout: ${e.toString()}';
    }
  }
}
