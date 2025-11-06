import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:strength_design/src/data/models/food.dart';
import 'package:strength_design/src/data/repositories/nutrition_repository.dart';
import 'package:strength_design/src/data/repositories/nutrition_repository_provider.dart';
import 'package:strength_design/src/features/nutrition/nutrition_screen.dart';

class MockNutritionRepository implements NutritionRepository {
  @override
  Future<List<Food>> searchFood(String query) async {
    if (query == 'apple') {
      return [
        Food(
          barcode: '123',
          name: 'Apple',
          brand: 'Fruit',
          calories: 52,
          protein: 0.3,
          carbs: 14,
          fat: 0.2,
        ),
      ];
    }
    return [];
  }
}

void main() {
  testWidgets(
    'NutritionScreen displays search results and allows adding to log',
    (WidgetTester tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            nutritionRepositoryProvider.overrideWithValue(
              MockNutritionRepository(),
            ),
          ],
          child: const MaterialApp(home: NutritionScreen()),
        ),
      );

      // Enter 'apple' into the search field and tap the search icon
      await tester.enterText(find.byType(TextField), 'apple');
      await tester.tap(find.byIcon(Icons.search));
      await tester.pump(); // Rebuild the widget after state change

      // Wait for the FutureProvider to resolve
      await tester.pumpAndSettle();

      // Verify that the search result is displayed
      expect(find.text('Apple'), findsOneWidget);
      expect(find.text('Fruit'), findsOneWidget);

      // Tap the add button
      await tester.tap(find.byIcon(Icons.add));
      await tester.pumpAndSettle();

      // Verify that the food item is added to the log and totals are updated
      expect(find.text('52'), findsOneWidget); // Calories
    },
  );
}
