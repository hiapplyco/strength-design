
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_ui_auth/firebase_ui_auth.dart' as ui;
import 'package:strength_design/src/features/home/home_screen.dart';

import 'package:strength_design/src/features/workout/ai_workout_screen.dart';
import 'package:strength_design/src/features/workout/exercise_library_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateChangesProvider);

  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const HomeScreen(),
        routes: [
          GoRoute(
            path: 'workouts',
            builder: (context, state) => const ExerciseLibraryScreen(),
          ),
          GoRoute(
            path: 'generator',
            builder: (context, state) => const AiWorkoutScreen(),
          ),
        ],
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) {
          return ui.SignInScreen(
            providers: [ui.EmailAuthProvider()],
          );
        },
      ),
    ],
    redirect: (context, state) {
      final isAuthenticated = authState.asData?.value != null;
      final isLoggingIn = state.matchedLocation == '/login';

      if (!isAuthenticated && !isLoggingIn) {
        return '/login';
      }

      if (isAuthenticated && isLoggingIn) {
        return '/';
      }

      return null;
    },
  );
});

final authStateChangesProvider = StreamProvider<User?>((ref) {
  return FirebaseAuth.instance.authStateChanges();
});
