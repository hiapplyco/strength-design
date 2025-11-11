/**
 * Context System Verification Tests
 * 
 * Comprehensive test suite to verify the complete context system implementation.
 * Run these tests to ensure all context flows work correctly from data collection
 * to AI generation.
 * 
 * Usage:
 * 1. Import this file in your test environment
 * 2. Run individual test functions or the complete test suite
 * 3. Check console output for detailed results
 * 
 * Note: These are integration tests that require a running app with Firebase connection
 */

import contextAggregator from './services/contextAggregator';
import sessionContextManager from './services/sessionContextManager';
import healthService from './services/healthService';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ContextVerificationTests {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  /**
   * Run all verification tests
   */
  async runAllTests() {
    console.log('🧪 Starting Context System Verification Tests');
    console.log('=' * 60);

    try {
      // Core functionality tests
      await this.testContextAggregatorInitialization();
      await this.testSessionContextManagerInitialization();
      await this.testBasicDataFlow();
      
      // Data source tests
      await this.testUserProfileIntegration();
      await this.testWorkoutHistoryIntegration();
      await this.testHealthServiceIntegration();
      await this.testExerciseSelectionFlow();
      await this.testProgramSelectionFlow();
      
      // UI Integration tests
      await this.testContextStatusLineData();
      await this.testContextModalData();
      
      // AI Integration tests
      await this.testAIContextGeneration();
      await this.testContextPersonalization();
      
      // Performance tests
      await this.testCachingPerformance();
      await this.testErrorHandling();
      
      // Generate final report
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Test suite failed with error:', error);
      this.results.errors.push(`Test suite error: ${error.message}`);
    }
  }

  /**
   * Test 1: Context Aggregator Initialization
   */
  async testContextAggregatorInitialization() {
    console.log('\n🔧 Test 1: Context Aggregator Initialization');
    
    try {
      // Clear cache first
      contextAggregator.clearCache();
      
      // Test initialization
      const startTime = Date.now();
      const context = await contextAggregator.getContext();
      const loadTime = Date.now() - startTime;
      
      this.assert(context !== null, 'Context should be returned');
      this.assert(context.metadata !== undefined, 'Context should have metadata');
      this.assert(context.metadata.contextVersion !== undefined, 'Context should have version');
      this.assert(loadTime < 20000, `Context load should complete in under 20s (took ${loadTime}ms)`);
      
      console.log('✅ Context Aggregator initialization test passed');
      
    } catch (error) {
      this.fail('Context Aggregator initialization', error);
    }
  }

  /**
   * Test 2: Session Context Manager Initialization
   */
  async testSessionContextManagerInitialization() {
    console.log('\n🔧 Test 2: Session Context Manager Initialization');
    
    try {
      await sessionContextManager.initialize();
      
      const summary = await sessionContextManager.getSummary();
      const fullContext = await sessionContextManager.getFullContext();
      
      this.assert(summary !== null, 'Summary should be returned');
      this.assert(fullContext !== null, 'Full context should be returned');
      this.assert(summary.items && Array.isArray(summary.items), 'Summary should have items array');
      this.assert(summary.completionPercentage !== undefined, 'Summary should have completion percentage');
      
      console.log('✅ Session Context Manager initialization test passed');
      
    } catch (error) {
      this.fail('Session Context Manager initialization', error);
    }
  }

  /**
   * Test 3: Basic Data Flow
   */
  async testBasicDataFlow() {
    console.log('\n🔧 Test 3: Basic Data Flow');
    
    try {
      // Clear session first
      await sessionContextManager.clearSession();
      
      // Test adding exercises
      const testExercises = [
        {
          id: 'test-1',
          name: 'Push-ups',
          category: 'strength',
          primary_muscles: ['chest', 'triceps'],
          equipment: 'bodyweight'
        }
      ];
      
      await sessionContextManager.addExercises(testExercises, 'test');
      
      const summary = await sessionContextManager.getSummary();
      const exerciseItem = summary.items.find(item => item.type === 'exercises');
      
      this.assert(exerciseItem.count === 1, 'Exercise count should be 1');
      this.assert(summary.completionPercentage > 0, 'Completion percentage should increase');
      
      console.log('✅ Basic data flow test passed');
      
    } catch (error) {
      this.fail('Basic data flow', error);
    }
  }

  /**
   * Test 4: User Profile Integration
   */
  async testUserProfileIntegration() {
    console.log('\n🔧 Test 4: User Profile Integration');
    
    try {
      // Test biometric update
      const testBiometrics = {
        age: 30,
        height: 175,
        weight: 70,
        experienceLevel: 'intermediate'
      };
      
      await sessionContextManager.updateBiometrics(testBiometrics, 'test');
      
      const fullContext = await sessionContextManager.getFullContext();
      const summary = await sessionContextManager.getSummary();
      
      this.assert(fullContext.biometrics.age === 30, 'Age should be stored correctly');
      this.assert(fullContext.biometrics.height === 175, 'Height should be stored correctly');
      
      const biometricItem = summary.items.find(item => item.type === 'biometrics');
      this.assert(biometricItem.hasData === true, 'Biometric data should be marked as present');
      
      console.log('✅ User profile integration test passed');
      
    } catch (error) {
      this.fail('User profile integration', error);
    }
  }

  /**
   * Test 5: Workout History Integration
   */
  async testWorkoutHistoryIntegration() {
    console.log('\n🔧 Test 5: Workout History Integration');
    
    try {
      // Test with context aggregator (requires authentication)
      const context = await contextAggregator.getContext();
      
      this.assert(context.workoutHistory !== undefined, 'Workout history should be present');
      this.assert(context.workoutHistory.workouts !== undefined, 'Workouts array should exist');
      this.assert(context.workoutHistory.stats !== undefined, 'Workout stats should exist');
      
      console.log('✅ Workout history integration test passed');
      
    } catch (error) {
      this.fail('Workout history integration', error);
    }
  }

  /**
   * Test 6: Health Service Integration
   */
  async testHealthServiceIntegration() {
    console.log('\n🔧 Test 6: Health Service Integration');
    
    try {
      const context = await contextAggregator.getContext();
      
      this.assert(context.health !== undefined, 'Health data should be present');
      this.assert(context.health.isConnected !== undefined, 'Health connection status should be available');
      
      // Test health metrics structure
      if (context.health.isConnected) {
        this.assert(context.health.today !== undefined, 'Today\'s health data should be available');
        this.assert(context.health.weekly !== undefined, 'Weekly health data should be available');
        console.log('📱 Health service is connected and providing data');
      } else {
        console.log('📱 Health service not connected (expected for testing)');
      }
      
      console.log('✅ Health service integration test passed');
      
    } catch (error) {
      this.fail('Health service integration', error);
    }
  }

  /**
   * Test 7: Exercise Selection Flow
   */
  async testExerciseSelectionFlow() {
    console.log('\n🔧 Test 7: Exercise Selection Flow');
    
    try {
      const testExercises = [
        {
          id: 'test-squat',
          name: 'Squats',
          category: 'strength',
          primary_muscles: ['quadriceps', 'glutes'],
          secondary_muscles: ['hamstrings', 'calves'],
          equipment: 'bodyweight',
          difficulty: 'beginner',
          instructions: ['Stand with feet shoulder-width apart', 'Lower down as if sitting in a chair']
        },
        {
          id: 'test-pushup',
          name: 'Push-ups',
          category: 'strength',
          primary_muscles: ['chest', 'triceps'],
          secondary_muscles: ['shoulders'],
          equipment: 'bodyweight',
          difficulty: 'beginner'
        }
      ];
      
      await sessionContextManager.addExercises(testExercises, 'search');
      
      const aiContext = await sessionContextManager.getAIChatContext();
      
      this.assert(aiContext.contextText.includes('Selected Exercises'), 'AI context should include exercise section');
      this.assert(aiContext.contextText.includes('Squats'), 'AI context should include exercise names');
      this.assert(aiContext.contextText.includes('quadriceps'), 'AI context should include muscle groups');
      this.assert(aiContext.contextText.includes('bodyweight'), 'AI context should include equipment');
      
      console.log('✅ Exercise selection flow test passed');
      
    } catch (error) {
      this.fail('Exercise selection flow', error);
    }
  }

  /**
   * Test 8: Program Selection Flow
   */
  async testProgramSelectionFlow() {
    console.log('\n🔧 Test 8: Program Selection Flow');
    
    try {
      const testProgram = {
        name: 'Starting Strength',
        creator: 'Mark Rippetoe',
        description: 'Basic strength program for beginners',
        methodology: 'Linear progression with compound movements',
        goals: ['strength', 'muscle'],
        difficulty: 'beginner',
        duration: '3-6 months',
        equipment: ['barbell', 'rack'],
        exercises: ['Squat', 'Deadlift', 'Bench Press', 'Overhead Press'],
        schedule: '3 days per week'
      };
      
      await sessionContextManager.addProgram(testProgram, 'search');
      
      const aiContext = await sessionContextManager.getAIChatContext();
      const summary = await sessionContextManager.getSummary();
      
      this.assert(aiContext.contextText.includes('Selected Program'), 'AI context should include program section');
      this.assert(aiContext.contextText.includes('Starting Strength'), 'AI context should include program name');
      this.assert(aiContext.contextText.includes('Linear progression'), 'AI context should include methodology');
      
      const programItem = summary.items.find(item => item.type === 'programs');
      this.assert(programItem.count === 1, 'Program count should be 1');
      this.assert(programItem.details.name === 'Starting Strength', 'Program details should be available');
      
      console.log('✅ Program selection flow test passed');
      
    } catch (error) {
      this.fail('Program selection flow', error);
    }
  }

  /**
   * Test 9: Context Status Line Data
   */
  async testContextStatusLineData() {
    console.log('\n🔧 Test 9: Context Status Line Data');
    
    try {
      const summary = await sessionContextManager.getSummary();
      
      this.assert(summary.items.length > 0, 'Summary should have items');
      this.assert(summary.completionPercentage >= 0 && summary.completionPercentage <= 100, 'Completion percentage should be valid');
      
      // Verify item structure
      summary.items.forEach((item, index) => {
        this.assert(item.type !== undefined, `Item ${index} should have type`);
        this.assert(item.icon !== undefined, `Item ${index} should have icon`);
        this.assert(item.label !== undefined, `Item ${index} should have label`);
      });
      
      console.log('✅ Context status line data test passed');
      
    } catch (error) {
      this.fail('Context status line data', error);
    }
  }

  /**
   * Test 10: Context Modal Data
   */
  async testContextModalData() {
    console.log('\n🔧 Test 10: Context Modal Data');
    
    try {
      const summary = await sessionContextManager.getSummary();
      
      this.assert(summary.recommendations !== undefined, 'Summary should include recommendations');
      this.assert(Array.isArray(summary.recommendations), 'Recommendations should be an array');
      
      if (summary.recommendations.length > 0) {
        const rec = summary.recommendations[0];
        this.assert(rec.type !== undefined, 'Recommendation should have type');
        this.assert(rec.title !== undefined, 'Recommendation should have title');
        this.assert(rec.description !== undefined, 'Recommendation should have description');
        this.assert(rec.screen !== undefined, 'Recommendation should have target screen');
      }
      
      console.log('✅ Context modal data test passed');
      
    } catch (error) {
      this.fail('Context modal data', error);
    }
  }

  /**
   * Test 11: AI Context Generation
   */
  async testAIContextGeneration() {
    console.log('\n🔧 Test 11: AI Context Generation');
    
    try {
      const aiContext = await sessionContextManager.getAIChatContext();
      
      this.assert(aiContext.contextText !== undefined, 'AI context text should be available');
      this.assert(aiContext.summary !== undefined, 'AI context should include summary');
      this.assert(aiContext.fullContext !== undefined, 'AI context should include full context');
      
      // Verify structure for AI consumption
      this.assert(typeof aiContext.contextText === 'string', 'Context text should be string');
      this.assert(aiContext.contextText.length > 0, 'Context text should not be empty');
      
      console.log(`📝 AI Context text length: ${aiContext.contextText.length} characters`);
      console.log('✅ AI context generation test passed');
      
    } catch (error) {
      this.fail('AI context generation', error);
    }
  }

  /**
   * Test 12: Context Personalization
   */
  async testContextPersonalization() {
    console.log('\n🔧 Test 12: Context Personalization');
    
    try {
      const context = await contextAggregator.getContext();
      
      // Test insights generation
      this.assert(context.insights !== undefined, 'Context should include insights');
      this.assert(context.recommendations !== undefined, 'Context should include recommendations');
      
      // Test biometric integration
      if (context.biometrics) {
        this.assert(typeof context.biometrics === 'object', 'Biometrics should be object');
      }
      
      // Test health insights
      if (context.healthInsights) {
        this.assert(Array.isArray(context.healthInsights), 'Health insights should be array');
      }
      
      console.log('✅ Context personalization test passed');
      
    } catch (error) {
      this.fail('Context personalization', error);
    }
  }

  /**
   * Test 13: Caching Performance
   */
  async testCachingPerformance() {
    console.log('\n🔧 Test 13: Caching Performance');
    
    try {
      // First load (should be slower)
      contextAggregator.clearCache();
      const startTime1 = Date.now();
      await contextAggregator.getContext();
      const loadTime1 = Date.now() - startTime1;
      
      // Second load (should use cache)
      const startTime2 = Date.now();
      await contextAggregator.getContext();
      const loadTime2 = Date.now() - startTime2;
      
      this.assert(loadTime2 < loadTime1, `Cached load should be faster (${loadTime2}ms vs ${loadTime1}ms)`);
      this.assert(loadTime2 < 1000, `Cached load should be under 1s (took ${loadTime2}ms)`);
      
      console.log(`⚡ First load: ${loadTime1}ms, Cached load: ${loadTime2}ms`);
      console.log('✅ Caching performance test passed');
      
    } catch (error) {
      this.fail('Caching performance', error);
    }
  }

  /**
   * Test 14: Error Handling
   */
  async testErrorHandling() {
    console.log('\n🔧 Test 14: Error Handling');
    
    try {
      // Test with network timeout simulation
      // This is a bit tricky to test without mocking, so we'll test graceful degradation
      
      // Test context aggregator with potential failures
      const context = await contextAggregator.getContext();
      
      // Should always return some context, even if minimal
      this.assert(context !== null, 'Context should never be null');
      this.assert(context.metadata !== undefined, 'Metadata should always be present');
      
      // Test session manager error handling
      try {
        await sessionContextManager.addExercises(null); // Invalid input
      } catch (error) {
        // Should handle gracefully
      }
      
      const summary = await sessionContextManager.getSummary();
      this.assert(summary !== null, 'Summary should be available even after errors');
      
      console.log('✅ Error handling test passed');
      
    } catch (error) {
      this.fail('Error handling', error);
    }
  }

  /**
   * Test Helper: Debug Current Context State
   */
  async debugCurrentState() {
    console.log('\n🔍 DEBUG: Current Context State');
    
    try {
      const summary = await sessionContextManager.getSummary();
      const fullContext = await sessionContextManager.getFullContext();
      const aggregatorContext = await contextAggregator.getContext();
      
      console.log('Session Summary:', {
        completionPercentage: summary.completionPercentage,
        completedCount: summary.completedCount,
        totalItems: summary.totalItems,
        hasMinimalContext: summary.hasMinimalContext,
        hasRichContext: summary.hasRichContext
      });
      
      console.log('Session Items:');
      summary.items.forEach(item => {
        console.log(`  - ${item.icon} ${item.label}: ${item.count !== undefined ? item.count : (item.hasData ? 'Yes' : 'No')}`);
      });
      
      console.log('Context Sources:');
      console.log(`  - Exercises: ${fullContext.exercises.length}`);
      console.log(`  - Programs: ${fullContext.programs.length}`);
      console.log(`  - Biometrics: ${Object.keys(fullContext.biometrics).length} fields`);
      console.log(`  - Preferences: ${Object.keys(fullContext.preferences).length} fields`);
      
      console.log('Aggregator Context:');
      console.log(`  - Has health data: ${aggregatorContext.health?.isConnected || false}`);
      console.log(`  - Has workout history: ${aggregatorContext.workoutHistory?.totalCount || 0} workouts`);
      console.log(`  - Has biometric insights: ${aggregatorContext.healthInsights?.length || 0} insights`);
      
      return {
        sessionSummary: summary,
        aggregatorContext: aggregatorContext
      };
      
    } catch (error) {
      console.error('❌ Debug error:', error);
      return null;
    }
  }

  // Test utilities

  assert(condition, message) {
    this.results.total++;
    if (condition) {
      this.results.passed++;
    } else {
      this.results.failed++;
      this.results.errors.push(message);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  fail(testName, error) {
    this.results.total++;
    this.results.failed++;
    this.results.errors.push(`${testName}: ${error.message}`);
    console.log(`❌ ${testName} test failed: ${error.message}`);
  }

  generateTestReport() {
    console.log('\n' + '=' * 60);
    console.log('📊 Context System Test Results');
    console.log('=' * 60);
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed} ✅`);
    console.log(`Failed: ${this.results.failed} ❌`);
    console.log(`Success Rate: ${Math.round((this.results.passed / this.results.total) * 100)}%`);
    
    if (this.results.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    const status = this.results.failed === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED';
    console.log(`\n${status}`);
    console.log('=' * 60);
    
    return {
      passed: this.results.failed === 0,
      summary: this.results
    };
  }
}

// Export for use in test environment
export default ContextVerificationTests;

// Example usage:
// const tests = new ContextVerificationTests();
// tests.runAllTests().then(() => console.log('Tests completed'));

// Individual test examples:
// tests.testContextAggregatorInitialization();
// tests.testExerciseSelectionFlow();
// tests.debugCurrentState();