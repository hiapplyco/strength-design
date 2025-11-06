import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sqflite/sqflite.dart';
import 'package:strength_design/src/core/services/database_service.dart';
import 'package:strength_design/src/data/repositories/exercise_repository.dart';

final firestoreProvider = Provider<FirebaseFirestore>(
  (ref) => FirebaseFirestore.instance,
);

final databaseProvider = FutureProvider<Database>((ref) async {
  return await DatabaseService.initDatabase();
});

final exerciseRepositoryProvider = Provider<ExerciseRepository>((ref) {
  final firestore = ref.watch(firestoreProvider);
  final database = ref.watch(databaseProvider).asData!.value;
  return ExerciseRepository(firestore, database);
});
