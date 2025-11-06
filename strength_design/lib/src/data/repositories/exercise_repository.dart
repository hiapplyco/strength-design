import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:sqflite/sqflite.dart';
import 'package:strength_design/src/data/models/exercise.dart';

import 'package:flutter/foundation.dart';

class ExerciseRepository {
  final FirebaseFirestore _firestore;
  final Database _database;

  ExerciseRepository(this._firestore, this._database);

  Future<List<Exercise>> getExercises() async {
    try {
      // First, try to fetch from the local database
      final List<Map<String, dynamic>> maps = await _database.query(
        'exercises',
      );
      if (maps.isNotEmpty) {
        return maps.map((map) => Exercise.fromMap(map)).toList();
      }

      // If the local database is empty, fetch from Firestore
      final QuerySnapshot snapshot =
          await _firestore.collection('exercises').get();
      final List<Exercise> exercises = snapshot.docs.map((doc) {
        return Exercise.fromMap(doc.data() as Map<String, dynamic>);
      }).toList();

      // Cache the exercises in the local database
      for (final exercise in exercises) {
        await _database.insert('exercises', exercise.toMap());
      }

      return exercises;
    } catch (e) {
      debugPrint(e.toString());
      return [];
    }
  }
}
