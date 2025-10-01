# AI Agent Instructions

> These instructions guide Claude Code's behavior when working on this project. Keep them concise and actionable.

---

## Core Philosophy

**Production-First Development**: Write production-quality code from the start. No placeholders, no TODOs, no "we'll fix it later."

**Test-Driven Workflow**: Write tests alongside features. A feature isn't complete without tests.

**Clear Communication**: Be direct and concise. Explain what you're doing and why when making significant changes.

---

## Absolute Rules

### ❌ NEVER
- Use placeholder comments like `// TODO: implement this`
- Skip error handling or use generic `catch (error)`
- Duplicate code across files (DRY principle)
- Make partial implementations
- Commit code that doesn't pass tests
- Ignore TypeScript errors or use `@ts-ignore` without explanation
- Create files without reading similar existing files first

### ✅ ALWAYS
- Read existing code patterns before writing new code
- Run tests after making changes
- Handle errors with specific, actionable error messages
- Use proper TypeScript types (no `any` without justification)
- Follow established naming conventions
- Update documentation when changing functionality
- Ask for clarification when requirements are ambiguous

---

## Development Workflow

### Before Starting Any Task:
1. **Read Context**: Read relevant files to understand patterns
2. **Check Tests**: Verify existing tests pass
3. **Plan Approach**: Outline changes before implementing

### During Implementation:
1. **Follow Patterns**: Use existing code patterns and conventions
2. **Write Tests**: Add tests for new functionality
3. **Handle Errors**: Implement comprehensive error handling
4. **Update Types**: Keep TypeScript definitions current

### After Completing Task:
1. **Run Tests**: Ensure all tests pass
2. **Verify Build**: Check that build succeeds
3. **Review Changes**: Check for any unintended side effects
4. **Update Docs**: Update CLAUDE.md or comments if needed

---

## Code Quality Standards

### Error Handling
```typescript
// ❌ Bad - Generic error handling
try {
  await fetchData();
} catch (error) {
  console.error('Error:', error);
}

// ✅ Good - Specific, actionable error handling
try {
  await fetchData();
} catch (error) {
  if (error instanceof NetworkError) {
    throw new Error('Failed to fetch data: Network connection lost. Check your internet connection.');
  }
  throw error;
}
```

### Type Safety
```typescript
// ❌ Bad - Using 'any'
function processData(data: any) { ... }

// ✅ Good - Proper typing
interface UserData {
  id: string;
  name: string;
  email: string;
}
function processData(data: UserData) { ... }
```

### Function Composition
```typescript
// ❌ Bad - Large functions doing multiple things
function handleUserSubmit(data) {
  // 100 lines of validation, API calls, state updates
}

// ✅ Good - Small, composable functions
function validateUserData(data: UserInput): ValidationResult { ... }
function submitToAPI(data: ValidatedUser): Promise<APIResponse> { ... }
function updateUserState(response: APIResponse): void { ... }

async function handleUserSubmit(data: UserInput) {
  const validation = validateUserData(data);
  if (!validation.isValid) return;

  const response = await submitToAPI(validation.data);
  updateUserState(response);
}
```

---

## Testing Requirements

### Unit Tests
- Test all utility functions
- Test complex logic and calculations
- Test error handling paths
- Aim for >80% code coverage

### Integration Tests
- Test API endpoints end-to-end
- Test database operations
- Test authentication flows

### Component Tests (Frontend)
- Test user interactions
- Test conditional rendering
- Test error states

---

## Communication Style

### Tone
- Be professional but approachable
- Be concise - avoid unnecessary preamble
- Be specific - reference exact files and line numbers
- Be helpful - suggest alternatives when blocking issues arise

### When to Explain
- ✅ Explain architectural decisions
- ✅ Explain complex algorithms
- ✅ Explain why certain approaches were chosen
- ❌ Don't explain obvious changes (e.g., "I added a button")
- ❌ Don't repeat what the code clearly shows

### Progress Updates
- Update TODO list when working on multi-step tasks
- Mark items complete immediately when finished
- Add new discovered tasks as they come up

---

## Project-Specific Guidelines

### File Organization
- Web: `src/components/`, `src/pages/`, `src/hooks/`, `src/lib/`
- Mobile: `mobile/screens/`, `mobile/services/`, `mobile/components/`
- Firebase Functions: `functions/src/`

### Naming Conventions
- Components: PascalCase (`UserProfile.tsx`)
- Hooks: camelCase with `use` prefix (`useWorkoutData.ts`)
- Services: camelCase (`searchService.js`)
- Constants: UPPER_SNAKE_CASE

### Common Patterns
- Use shadcn/ui components for web UI
- Firebase Cloud Functions for AI operations
- React Query for data fetching
- Gemini 2.5 Flash for all AI features

---

## Sub-Agent Usage

When tasks are complex or require multiple rounds of searching:

### Use `file-analyzer` agent for:
- Finding specific functions or patterns across many files
- Analyzing dependencies and imports
- Searching for security issues or anti-patterns

### Use `code-analyzer` agent for:
- Understanding complex code flow
- Identifying refactoring opportunities
- Analyzing performance bottlenecks

### Use `test-runner` agent for:
- Running comprehensive test suites
- Identifying test coverage gaps
- Debugging failing tests

---

## Emergency Protocols

### When Build Breaks:
1. Check recent changes with `git diff`
2. Verify dependencies with `npm list` or equivalent
3. Check for environment variable issues
4. Clear cache and reinstall dependencies
5. Report exact error messages

### When Tests Fail:
1. Run failing test in isolation
2. Check for changes in test fixtures or mocks
3. Verify database/API state
4. Check for timing issues or race conditions
5. Add debugging logs to understand failure

### When Unclear About Requirements:
1. **ASK** - Don't guess or make assumptions
2. Reference similar existing features
3. Propose 2-3 approaches with trade-offs
4. Wait for clarification before implementing

---

*These instructions override default AI behavior. Follow them strictly.*
