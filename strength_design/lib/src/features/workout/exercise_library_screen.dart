
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:strength_design/src/data/models/exercise.dart';
import 'package:strength_design/src/data/repositories/exercise_repository_provider.dart';

final exercisesProvider = FutureProvider<List<Exercise>>((ref) async {
  return ref.watch(exerciseRepositoryProvider).getExercises();
});

class ExerciseLibraryScreen extends ConsumerWidget {
  const ExerciseLibraryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final exercises = ref.watch(exercisesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Exercise Library'),
      ),
      body: exercises.when(
        data: (data) {
          return ListView.builder(
            itemCount: data.length,
            itemBuilder: (context, index) {
              final exercise = data[index];
              return ListTile(
                title: Text(exercise.name),
                subtitle: Text(exercise.muscleGroups.join(', ')),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => Center(child: Text(error.toString())),
      ),
    );
  }
}
