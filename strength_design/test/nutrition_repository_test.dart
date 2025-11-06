import 'package:flutter_test/flutter_test.dart';
import 'package:openfoodfacts/openfoodfacts.dart';
import 'package:strength_design/src/data/repositories/nutrition_repository.dart';

void main() {
  test('NutritionRepository.searchFood returns a list of food', () async {
    OpenFoodAPIConfiguration.userAgent = UserAgent(name: 'strength_design');
    final repository = NutritionRepository();
    final result = await repository.searchFood('chicken');
    expect(result, isNotNull);
  });
}
