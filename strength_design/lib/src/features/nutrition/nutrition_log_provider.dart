import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:strength_design/src/data/models/food.dart';

class NutritionLogNotifier extends Notifier<List<Food>> {
  @override
  List<Food> build() {
    return [];
  }

  void addFood(Food food) {
    state = [...state, food];
  }

  void removeFood(Food food) {
    state = state.where((item) => item.barcode != food.barcode).toList();
  }

  double get totalCalories =>
      state.fold(0, (total, food) => total + food.calories);
  double get totalProtein =>
      state.fold(0, (total, food) => total + food.protein);
  double get totalCarbs => state.fold(0, (total, food) => total + food.carbs);
  double get totalFat => state.fold(0, (total, food) => total + food.fat);
}

final nutritionLogProvider = NotifierProvider<NutritionLogNotifier, List<Food>>(
  NutritionLogNotifier.new,
);
