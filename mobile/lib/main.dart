import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

import 'src/features/pose_analysis/domain/entities/analysis_result.dart';
import 'firebase_options.dart'; // Assuming this file will be generated
import 'src/features/pose_analysis/presentation/screens/live_streaming_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await dotenv.load(fileName: ".env");

  // TODO: Configure Firebase for the project.
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // Enable offline persistence
  FirebaseFirestore.instance.settings = const Settings(
    persistenceEnabled: true,
    cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
  );

  // Initialize Hive for local storage
  await Hive.initFlutter();
  Hive.registerAdapter(PoseAnalysisResultAdapter()); // Register the adapter
  await Hive.openBox<PoseAnalysisResult>('analysisCache');

  runApp(
    const ProviderScope(
      child: MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      home: LiveStreamingScreen(),
    );
  }
}
