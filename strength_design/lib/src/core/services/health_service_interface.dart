import 'package:health/health.dart';
import 'package:strength_design/src/core/services/health_summary.dart';

abstract class HealthServiceInterface {
  Future<bool> hasPermissions();
  Future<bool> requestAuthorization();
  Future<List<HealthDataPoint>> getTodaysSteps();
  Future<HealthSummary> getTodaysSummary();
}
