import 'package:flutter/foundation.dart';
import 'package:openfoodfacts/openfoodfacts.dart';
import 'package:strength_design/src/data/models/food.dart';

class NutritionRepository {
  Future<List<Food>> searchFood(String query) async {
    try {
      final ProductSearchQueryConfiguration configuration =
          ProductSearchQueryConfiguration(
        parametersList: <Parameter>[
          SearchTerms(terms: [query]),
        ],
        fields: [ProductField.ALL],
        language: OpenFoodFactsLanguage.ENGLISH,
        version: ProductQueryVersion.v3,
      );

      final SearchResult result = await OpenFoodAPIClient.searchProducts(
        null,
        configuration,
      );

      if (result.products != null) {
        return result.products!.map((product) {
          return Food(
            barcode: product.barcode ?? '',
            name: product.productName ?? '',
            brand: product.brands ?? '',
            calories: product.nutriments?.getValue(
                  Nutrient.energyKCal,
                  PerSize.oneHundredGrams,
                ) ??
                0.0,
            protein: product.nutriments?.getValue(
                  Nutrient.proteins,
                  PerSize.oneHundredGrams,
                ) ??
                0.0,
            carbs: product.nutriments?.getValue(
                  Nutrient.carbohydrates,
                  PerSize.oneHundredGrams,
                ) ??
                0.0,
            fat: product.nutriments?.getValue(
                  Nutrient.fat,
                  PerSize.oneHundredGrams,
                ) ??
                0.0,
          );
        }).toList();
      }

      return [];
    } catch (e) {
      debugPrint(e.toString());
      return [];
    }
  }
}
