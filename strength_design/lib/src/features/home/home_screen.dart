import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:strength_design/src/core/services/health_summary.dart';
import 'package:strength_design/src/features/home/health_summary_provider.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(healthSummaryProvider.notifier).initialize();
    });
  }

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
    switch (index) {
      case 1:
        context.go('/workouts');
        break;
      case 2:
        context.go('/generator');
        break;
      case 3:
        context.go('/nutrition');
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final healthState = ref.watch(healthSummaryProvider);
    final healthNotifier = ref.read(healthSummaryProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Strength Design'),
        centerTitle: false,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: ListView(
          children: [
            _HealthSummaryCard(
              state: healthState,
              onAuthorize: healthNotifier.requestAuthorization,
              onRefresh: healthNotifier.refresh,
            ),
            const SizedBox(height: 24),
            Text(
              'Quick Actions',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            _QuickActionTile(
              icon: Icons.fitness_center,
              title: 'Exercise Library',
              subtitle: 'Browse workouts by muscle group and equipment.',
              onTap: () => context.go('/workouts'),
            ),
            _QuickActionTile(
              icon: Icons.lightbulb,
              title: 'AI Workout Generator',
              subtitle: 'Generate personalized workouts with Gemini.',
              onTap: () => context.go('/generator'),
            ),
            _QuickActionTile(
              icon: Icons.restaurant,
              title: 'Nutrition Log',
              subtitle: 'Search foods and track your daily intake.',
              onTap: () => context.go('/nutrition'),
            ),
          ],
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        items: const <BottomNavigationBarItem>[
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.fitness_center),
            label: 'Workouts',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.lightbulb),
            label: 'Generator',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.restaurant),
            label: 'Nutrition',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
        currentIndex: _selectedIndex,
        selectedItemColor: Theme.of(context).colorScheme.primary,
        unselectedItemColor: Colors.grey,
        onTap: _onItemTapped,
      ),
    );
  }
}

class _HealthSummaryCard extends StatelessWidget {
  const _HealthSummaryCard({
    required this.state,
    required this.onAuthorize,
    required this.onRefresh,
  });

  final HealthSummaryState state;
  final Future<void> Function() onAuthorize;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    Widget content;

    if (state.isLoading && state.summary == null) {
      content = const Center(child: CircularProgressIndicator());
    } else if (!state.authorized) {
      content = Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Connect Your Activity',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          const Text(
            'Sync Apple Health or Google Fit to see your daily movement and workouts.',
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: onAuthorize,
            icon: const Icon(Icons.favorite),
            label: const Text('Connect Health Data'),
          ),
          if (state.error != null) ...[
            const SizedBox(height: 12),
            Text(
              state.error!,
              style: TextStyle(
                color: Theme.of(context).colorScheme.error,
              ),
            ),
          ],
        ],
      );
    } else {
      final summary = state.summary ?? const HealthSummary.empty();
      content = Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Today\'s Activity',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              IconButton(
                onPressed: onRefresh,
                icon: const Icon(Icons.refresh),
                tooltip: 'Refresh metrics',
              ),
            ],
          ),
          if (state.isLoading) const LinearProgressIndicator(minHeight: 2),
          const SizedBox(height: 12),
          if (state.error != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 8.0),
              child: Text(
                state.error!,
                style: TextStyle(
                  color: Theme.of(context).colorScheme.error,
                ),
              ),
            ),
          if (!summary.hasMetrics)
            const Text(
              'No health data has been synced yet. Open your fitness app to ensure recent activity is available.',
            )
          else
            Wrap(
              spacing: 24,
              runSpacing: 16,
              children: [
                _MetricTile(
                  label: 'Steps',
                  value: summary.totalSteps.toString(),
                  icon: Icons.directions_walk,
                ),
                _MetricTile(
                  label: 'Active Energy',
                  value:
                      '${summary.activeEnergyBurned.toStringAsFixed(1)} kcal',
                  icon: Icons.local_fire_department,
                ),
                _MetricTile(
                  label: 'Workouts',
                  value: summary.workoutCount.toString(),
                  icon: Icons.timer,
                ),
                _MetricTile(
                  label: 'Workout Minutes',
                  value: summary.totalWorkoutMinutes.toString(),
                  icon: Icons.access_time,
                ),
              ],
            ),
          if (state.lastUpdated != null)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Text(
                'Last synced: ${_formatTimestamp(state.lastUpdated!)}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
        ],
      );
    }

    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 3,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: content,
      ),
    );
  }

  String _formatTimestamp(DateTime timestamp) {
    final now = DateTime.now();
    if (timestamp.day == now.day &&
        timestamp.month == now.month &&
        timestamp.year == now.year) {
      final hours = timestamp.hour.toString().padLeft(2, '0');
      final minutes = timestamp.minute.toString().padLeft(2, '0');
      return 'Today at $hours:$minutes';
    }
    final date = '${timestamp.month}/${timestamp.day}/${timestamp.year}';
    final hours = timestamp.hour.toString().padLeft(2, '0');
    final minutes = timestamp.minute.toString().padLeft(2, '0');
    return '$date $hours:$minutes';
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 140,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: Theme.of(context).colorScheme.primary),
          const SizedBox(height: 4),
          Text(
            value,
            style: Theme.of(context)
                .textTheme
                .headlineSmall
                ?.copyWith(fontWeight: FontWeight.bold),
          ),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}

class _QuickActionTile extends StatelessWidget {
  const _QuickActionTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: ListTile(
        leading: Icon(icon, size: 28),
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
