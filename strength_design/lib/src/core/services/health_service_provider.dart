import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:strength_design/src/core/services/health_service.dart';
import 'package:strength_design/src/core/services/health_service_interface.dart';

final healthServiceProvider = Provider<HealthServiceInterface>((ref) {
  return HealthService();
});
