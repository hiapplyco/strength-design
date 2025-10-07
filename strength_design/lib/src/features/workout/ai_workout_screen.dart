
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:strength_design/src/core/services/ai_service_provider.dart';

class AiWorkoutScreen extends ConsumerStatefulWidget {
  const AiWorkoutScreen({super.key});

  @override
  ConsumerState<AiWorkoutScreen> createState() => _AiWorkoutScreenState();
}

class _AiWorkoutScreenState extends ConsumerState<AiWorkoutScreen> {
  final TextEditingController _promptController = TextEditingController();
  String _workout = '';
  bool _isLoading = false;

  void _generateWorkout() async {
    setState(() {
      _isLoading = true;
    });
    final aiService = ref.read(aiServiceProvider);
    final workout = await aiService.generateWorkout(_promptController.text);
    setState(() {
      _workout = workout;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Workout Generator'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _promptController,
              decoration: const InputDecoration(
                labelText: 'Enter your workout prompt',
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _isLoading ? null : _generateWorkout,
              child: _isLoading
                  ? const CircularProgressIndicator()
                  : const Text('Generate Workout'),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: SingleChildScrollView(
                child: Text(_workout),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
