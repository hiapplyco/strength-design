# Auto Execute and Implement Requirements

## Purpose
Automate the implementation of requirements in Claude Code with structured planning, execution, and validation phases.

## Agent Instructions

### Phase 1: Planning & Analysis (10-15% time)

#### 1.1 Project Setup
- **Assign Project Name**: Use PascalCase format (e.g., `VideoAIIntegration`, `PaymentSystemRefactor`)
- **Create Requirements Doc**: `docs/Reqs_{ProjectName}.md`
- **Use Agent**: `strategic-planner` subagent for comprehensive planning

#### 1.2 Requirements Analysis
```markdown
Read and analyze:
1. User requirements (explicit and implicit)
2. Existing codebase structure
3. Dependencies and integrations
4. Potential conflicts or breaking changes
```

#### 1.3 Task Breakdown
Create TodoWrite list with:
- Clear, actionable items (max 10-15 words each)
- Priority levels (P0: Critical, P1: High, P2: Medium)
- Estimated time per task
- Dependencies between tasks

### Phase 2: Implementation (70-75% time)

#### 2.1 Pre-Implementation Checks
```bash
# Always run before starting
git status                    # Check for uncommitted changes
npm test                      # Ensure tests pass
npm run typecheck            # Verify TypeScript
npm run lint                 # Check code quality
```

#### 2.2 Implementation Strategy
- **Use Agent**: `software-e-todo` subagent for code implementation
- **Follow Pattern**: Read → Plan → Implement → Verify
- **File Operations**:
  - ALWAYS read files before editing
  - Prefer `MultiEdit` for multiple changes
  - Use `Edit` with `replace_all` for refactoring
  - Create new files ONLY when necessary

#### 2.3 Code Quality Standards
```typescript
// Production-ready patterns
try {
  // Operation with logging
  logger.info('Starting operation', { context });
  const result = await operation();
  logger.info('Success', { result });
  return result;
} catch (error) {
  logger.error('Failed', { error, context });
  // User-friendly error
  throw new UserError('Unable to complete. Please try again.');
}
```

### Phase 3: Testing & Validation (10-15% time)

#### 3.1 Testing Protocol
- **Use Agent**: `e2e-testing-export` for comprehensive testing
- **Test Types**:
  1. Unit tests for new functions
  2. Integration tests for API changes
  3. E2E tests for user flows
  4. Manual testing for UI changes

#### 3.2 Validation Checklist
```markdown
- [ ] All TodoWrite items completed
- [ ] No console errors in development
- [ ] Tests passing (unit, integration, E2E)
- [ ] TypeScript compilation successful
- [ ] Linting rules satisfied
- [ ] Performance metrics maintained
- [ ] Accessibility standards met
```

### Phase 4: Documentation & Cleanup (5% time)

#### 4.1 Documentation Updates
- Update `MASTER_TRACKING.md` with changes
- Update component-specific `CLAUDE.md` if exists
- Add inline comments for complex logic
- Update API documentation if changed

#### 4.2 Project Summary
Generate `docs/Summary_{ProjectName}.md` containing:
```markdown
## Implementation Summary
- **Date**: [Date]
- **Duration**: [Time spent]
- **Files Modified**: [Count and list]
- **Tests Added**: [Count]
- **Breaking Changes**: [Yes/No, details]

## Key Changes
1. [Feature/Fix description]
2. [Technical implementation details]
3. [Impact on existing functionality]

## Testing Results
- Unit Tests: [Pass/Fail count]
- Integration Tests: [Pass/Fail count]
- E2E Tests: [Pass/Fail count]
- Manual Testing: [Checklist completed]

## Next Steps
- [Follow-up tasks if any]
- [Monitoring requirements]
- [Documentation needs]
```

#### 4.3 Cleanup
```bash
# Clean temporary files
rm -rf *.tmp *.log
# Archive logs if needed
mkdir -p logs/archive
mv *.log logs/archive/
# Update git
git add -A
git status
```

## Execution Patterns

### Pattern 1: Feature Implementation
```
1. Read existing code → 2. Plan changes → 3. Implement incrementally → 
4. Test each component → 5. Integration test → 6. Document
```

### Pattern 2: Bug Fix
```
1. Reproduce issue → 2. Identify root cause → 3. Fix with minimal changes → 
4. Add regression test → 5. Verify fix → 6. Document solution
```

### Pattern 3: Refactoring
```
1. Analyze current structure → 2. Plan migration path → 3. Create compatibility layer → 
4. Migrate incrementally → 5. Remove old code → 6. Update documentation
```

## Best Practices

### DO:
- ✅ Read files before editing
- ✅ Use TodoWrite for task tracking
- ✅ Test incrementally
- ✅ Commit working code frequently
- ✅ Handle errors gracefully
- ✅ Log important operations
- ✅ Follow existing patterns
- ✅ Ask for clarification when unclear

### DON'T:
- ❌ Make assumptions about code structure
- ❌ Skip reading relevant files
- ❌ Implement without planning
- ❌ Ignore TypeScript errors
- ❌ Leave console.log statements
- ❌ Create unnecessary files
- ❌ Break existing functionality
- ❌ Skip testing phase

## Error Recovery

### If Build Fails:
```bash
npm ci                        # Clean install
rm -rf node_modules && npm i  # Full reinstall
npm run typecheck            # Check types
npm run lint -- --fix        # Auto-fix lint
```

### If Tests Fail:
```bash
npm test -- --verbose        # Detailed output
npm test -- --watch         # Interactive mode
npm test -- --coverage      # Coverage report
```

### If Deployment Fails:
```bash
npm run build               # Check build
npm run build:analyze       # Bundle analysis
firebase deploy --debug     # Debug deployment
```

## Performance Metrics

### Target Metrics:
- **Response Time**: < 200ms for API calls
- **Bundle Size**: < 200KB main chunk
- **Test Coverage**: > 80% for new code
- **Lighthouse Score**: > 90 for web
- **Build Time**: < 5 minutes
- **Memory Usage**: < 500MB during build

## Communication Protocol

### Status Updates:
1. **Starting**: "Beginning {ProjectName} implementation"
2. **Progress**: "Completed {X/Y} tasks, currently {action}"
3. **Blocking**: "Blocked by {issue}, attempting {solution}"
4. **Complete**: "Finished {ProjectName}, {X} files modified"

### Error Reporting:
```markdown
**Error Encountered**:
- Location: [File:Line]
- Error: [Message]
- Context: [What was being attempted]
- Solution: [How it was/will be resolved]
```

## Success Criteria

A task is complete when:
1. All requirements are implemented
2. All tests pass
3. No regression in existing features
4. Documentation is updated
5. Code follows project standards
6. Performance metrics are met
7. User can successfully use the feature

---

**Version**: 2.0.0
**Last Updated**: 2025-01-13
**Optimized for**: Production-ready development with comprehensive testing