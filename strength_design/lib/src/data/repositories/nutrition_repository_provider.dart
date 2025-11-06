import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:strength_design/src/data/repositories/nutrition_repository.dart';

final nutritionRepositoryProvider = Provider<NutritionRepository>((ref) {
  return NutritionRepository();
});
