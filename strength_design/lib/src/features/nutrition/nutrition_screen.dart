import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:strength_design/src/data/models/food.dart';
import 'package:strength_design/src/data/repositories/nutrition_repository_provider.dart';
import 'package:strength_design/src/features/nutrition/nutrition_log_provider.dart';

final foodSearchProvider = FutureProvider.family<List<Food>, String>((
  ref,
  query,
) async {
  if (query.isEmpty) {
    return [];
  }
  return ref.watch(nutritionRepositoryProvider).searchFood(query);
});

class NutritionScreen extends ConsumerStatefulWidget {
  const NutritionScreen({super.key});

  @override
  ConsumerState<NutritionScreen> createState() => _NutritionScreenState();
}

class _NutritionScreenState extends ConsumerState<NutritionScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final foods = ref.watch(foodSearchProvider(_query));
    final loggedFoods = ref.watch(nutritionLogProvider);
    final logNotifier = ref.read(nutritionLogProvider.notifier);

    return Scaffold(
      appBar: AppBar(title: const Text('Nutrition')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            // Nutritional Totals
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildTotal('Calories', logNotifier.totalCalories),
                _buildTotal('Protein', logNotifier.totalProtein),
                _buildTotal('Carbs', logNotifier.totalCarbs),
                _buildTotal('Fat', logNotifier.totalFat),
              ],
            ),
            const SizedBox(height: 16),
            // Search Bar
            TextField(
              controller: _searchController,
              decoration: InputDecoration(
                labelText: 'Search for food',
                suffixIcon: IconButton(
                  icon: const Icon(Icons.search),
                  onPressed: () {
                    setState(() {
                      _query = _searchController.text;
                    });
                  },
                ),
              ),
            ),
            const SizedBox(height: 16),
            // Logged Foods or Search Results
            Expanded(
              child: _query.isEmpty
                  ? _buildLoggedFoods(loggedFoods, logNotifier)
                  : foods.when(
                      data: (data) => _buildSearchResults(data, logNotifier),
                      loading: () =>
                          const Center(child: CircularProgressIndicator()),
                      error: (error, stackTrace) =>
                          Center(child: Text(error.toString())),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTotal(String label, double value) {
    return Column(
      children: [
        Text(label, style: Theme.of(context).textTheme.bodySmall),
        Text(
          value.toStringAsFixed(0),
          style: Theme.of(context).textTheme.titleMedium,
        ),
      ],
    );
  }

  Widget _buildLoggedFoods(
    List<Food> loggedFoods,
    NutritionLogNotifier logNotifier,
  ) {
    return ListView.builder(
      itemCount: loggedFoods.length,
      itemBuilder: (context, index) {
        final food = loggedFoods[index];
        return ListTile(
          title: Text(food.name),
          subtitle: Text(food.brand),
          trailing: Text('${food.calories.toStringAsFixed(0)} kcal'),
          onLongPress: () => logNotifier.removeFood(food),
        );
      },
    );
  }

  Widget _buildSearchResults(
    List<Food> searchResults,
    NutritionLogNotifier logNotifier,
  ) {
    return ListView.builder(
      itemCount: searchResults.length,
      itemBuilder: (context, index) {
        final food = searchResults[index];
        return ListTile(
          title: Text(food.name),
          subtitle: Text(food.brand),
          trailing: IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              logNotifier.addFood(food);
              setState(() {
                _query = '';
                _searchController.clear();
              });
            },
          ),
        );
      },
    );
  }
}
