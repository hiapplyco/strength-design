import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:hive/hive.dart';
import '../../../../core/services/connectivity_service.dart';
import '../../domain/entities/analysis_result.dart';

class AnalysisRepository {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final Box<PoseAnalysisResult> _localCache = Hive.box('analysisCache');
  final ConnectivityService _connectivity;

  AnalysisRepository(this._connectivity);

  Stream<List<PoseAnalysisResult>> getAnalysisHistory() async* {
    // First emit local cache
    yield _localCache.values.toList();

    // Then sync with remote if online
    if (await _connectivity.isOnline()) {
      final remote = await _firestore
          .collection('poseAnalysisHistory')
          .get();

      final results = remote.docs
          .map((doc) => PoseAnalysisResult.fromFirestore(doc))
          .toList();

      // Update local cache
      await _localCache.clear();
      await _localCache.addAll(results);

      yield results;
    }
  }

  Future<void> saveAnalysis(PoseAnalysisResult result) async {
    // Save locally first
    await _localCache.add(result);

    // Queue for remote sync
    if (await _connectivity.isOnline()) {
      await _firestore
          .collection('poseAnalysisHistory')
          .add(result.toMap());
    } else {
      await _queueForSync(result);
    }
  }

  Future<void> _queueForSync(PoseAnalysisResult result) async {
    print('Analysis result queued for sync: ${result.toMap()}');
    // In a real application, you would store this in a local queue
    // (e.g., another Hive box) and attempt to sync it later.
  }
}


