# Auto Execute and Implement Requirements

## Purpose
Automate the implementation of requirements in Claude Code with structured planning, execution, and validation phases using the new consolidated documentation structure.

## 📚 Documentation Structure Reference

### Primary Documentation Hub
```
docs/
├── README.md                    # Master navigation and quick start
├── project-management/          # Current tasks and tracking
│   ├── PROJECT_STATUS.md       # Project overview and status
│   ├── MASTER_TRACKING.md      # Sprint tracking and metrics
│   └── ROADMAP.md              # Product roadmap and milestones
├── architecture/                # System design and technical decisions
│   ├── ARCHITECTURE_OVERVIEW.md # Complete system architecture
│   └── DATABASE_SCHEMA.md      # Data models and relationships
├── development/                 # Development guides and standards
│   ├── DEVELOPMENT_GUIDE.md    # Core development principles
│   └── CLAUDE_GUIDE.md         # AI assistant guidelines
├── features/                    # Feature documentation
│   └── FEATURE_MATRIX.md       # Complete feature inventory
├── design/                      # Design system and UI/UX
│   ├── GLASSMORPHISM_SYSTEM.md # Glass morphism implementation
│   └── MOBILE_REDESIGN_2025.md # Premium mobile design spec
├── platforms/                   # Platform-specific docs
│   ├── web/                    # Web application
│   └── mobile/                 # Mobile application
├── infrastructure/              # Backend and deployment
│   ├── FIREBASE_SETUP.md       # Firebase configuration
│   └── TWILIO_PHONE_AUTH.md    # Phone auth implementation
└── integrations/               # Third-party services
```

## Agent Instructions

### Phase 1: Planning & Analysis (10-15% time)

#### 1.1 Project Setup with Context
- **Assign Project Name**: Use PascalCase format (e.g., `VideoAIIntegration`, `PaymentSystemRefactor`)
- **Create Requirements Doc**: `docs/features/Reqs_{ProjectName}.md`
- **Reference Core Documentation**: 
  ```bash
  # Always check these first
  docs/project-management/MASTER_TRACKING.md  # Current sprint goals
  docs/features/FEATURE_MATRIX.md             # Existing implementations
  docs/development/CLAUDE_GUIDE.md            # Development standards
  docs/architecture/ARCHITECTURE_OVERVIEW.md  # System design
  ```

#### 1.2 Dynamic Agent Creation
```markdown
## Create Specialized Agents as Needed

### Assessment Criteria:
1. Task complexity and domain specificity
2. Required expertise and tools
3. Performance optimization needs
4. Testing and validation requirements

### Dynamic Agent Templates:

**For Architecture & Design:**
- Agent: `architecture-analyzer`
- Purpose: System design analysis and recommendations
- Tools: Read, Grep, architectural pattern analysis
- Reference: docs/architecture/

**For Testing & Quality:**
- Agent: `test-generator`
- Purpose: Comprehensive test creation and validation
- Tools: Testing frameworks, coverage analysis
- Reference: docs/development/DEVELOPMENT_GUIDE.md

**For Performance:**
- Agent: `performance-optimizer`
- Purpose: Code optimization and bundle analysis
- Tools: Profiling, bundle analyzers, metrics
- Reference: docs/analytics/

**For Security:**
- Agent: `security-auditor`
- Purpose: Security review and vulnerability scanning
- Tools: Security scanners, best practices validation
- Reference: Security sections in docs/development/

**For Documentation:**
- Agent: `documentation-writer`
- Purpose: Technical documentation and API specs
- Tools: Markdown generation, diagram creation
- Reference: docs/README.md structure

**Custom Feature Agents:**
Create domain-specific agents for:
- Payment processing
- AI/ML integration
- Real-time features
- Mobile-specific features
- Data migration
```

#### 1.3 Requirements Analysis with Documentation
```markdown
Read and analyze from organized docs:
1. User requirements + docs/project-management/ROADMAP.md alignment
2. Architecture constraints from docs/architecture/
3. Platform requirements from docs/platforms/{web|mobile}/
4. Integration needs from docs/integrations/
5. Design requirements from docs/design/
6. Feature conflicts from docs/features/FEATURE_MATRIX.md
```

#### 1.4 Enhanced Task Breakdown
```markdown
Create TodoWrite list with:
- Clear items linked to documentation sections
- Priority from docs/project-management/MASTER_TRACKING.md
- Dependencies from docs/architecture/
- Feature status from docs/features/FEATURE_MATRIX.md

Example:
- [ ] P0: Implement auth flow (ref: docs/infrastructure/FIREBASE_SETUP.md)
- [ ] P1: Add UI components (ref: docs/design/GLASSMORPHISM_SYSTEM.md)
- [ ] P2: Update tests (ref: docs/development/DEVELOPMENT_GUIDE.md)
```

### Phase 2: Implementation (70-75% time)

#### 2.1 Pre-Implementation Checks with Context
```bash
# Check project status
cat docs/project-management/PROJECT_STATUS.md | head -20

# Verify current sprint goals
grep -A 10 "Current Sprint" docs/project-management/MASTER_TRACKING.md

# Check for related features
grep -i "{feature_name}" docs/features/FEATURE_MATRIX.md

# Standard checks
git status
npm test
npm run typecheck
npm run lint
```

#### 2.2 Enhanced Implementation Strategy
- **Use Appropriate Agent**: 
  - `general-purpose` for standard features
  - Create custom agents for specialized domains
  - Use multiple agents concurrently when possible
  
- **Follow Documentation Pattern**:
  ```
  1. Read docs/development/CLAUDE_GUIDE.md for standards
  2. Check docs/architecture/ for system constraints
  3. Review docs/features/ for existing patterns
  4. Implement following docs/development/DEVELOPMENT_GUIDE.md
  5. Validate against docs/project-management/MASTER_TRACKING.md goals
  ```

#### 2.3 Code Quality Standards from Documentation
```typescript
// Follow patterns from docs/development/DEVELOPMENT_GUIDE.md
// Reference: Production Code Patterns section

import { logger } from '@/lib/logger';
import { analytics } from '@/lib/analytics';

export async function implementFeature(params: FeatureParams) {
  // Start with logging (ref: docs/development/DEVELOPMENT_GUIDE.md#logging)
  logger.info('Starting feature implementation', { 
    feature: 'FeatureName',
    params,
    sprint: 'Current Sprint from MASTER_TRACKING.md'
  });
  
  try {
    // Implementation following architecture patterns
    const result = await operation(params);
    
    // Track success (ref: docs/analytics/)
    analytics.track('feature_success', {
      feature: 'FeatureName',
      duration: Date.now() - startTime
    });
    
    return { success: true, data: result };
  } catch (error) {
    // Error handling per CLAUDE_GUIDE.md
    logger.error('Feature implementation failed', { error, params });
    
    // User-friendly error
    throw new UserError('Unable to complete action. Please try again.');
  }
}
```

### Phase 3: Testing & Validation (10-15% time)

#### 3.1 Testing Protocol with Documentation
- **Create Test Agent**: `test-validator` with access to test patterns
- **Test Requirements from docs/development/DEVELOPMENT_GUIDE.md**:
  1. Unit tests (>80% coverage for new code)
  2. Integration tests for API changes
  3. E2E tests for critical user flows
  4. Performance tests against metrics in docs/analytics/

#### 3.2 Enhanced Validation Checklist
```markdown
## Validation Against Documentation

### Feature Checklist (docs/features/FEATURE_MATRIX.md):
- [ ] Feature implemented as specified
- [ ] Platform compatibility verified (web/mobile)
- [ ] Integration points tested

### Architecture Checklist (docs/architecture/):
- [ ] Follows system architecture patterns
- [ ] Database schema compliance
- [ ] API contracts maintained

### Development Standards (docs/development/):
- [ ] Code quality standards met
- [ ] Error handling implemented
- [ ] Logging added appropriately
- [ ] TypeScript types complete

### Design Requirements (docs/design/):
- [ ] UI follows design system
- [ ] Responsive design verified
- [ ] Accessibility standards met (WCAG 2.1 AA)

### Performance Metrics (docs/analytics/):
- [ ] Response time < 200ms
- [ ] Bundle size within limits
- [ ] Memory usage acceptable
```

### Phase 4: Documentation & Cleanup (5% time)

#### 4.1 Comprehensive Documentation Updates
```markdown
## Update All Relevant Documentation

1. **Project Management** (docs/project-management/)
   - Update MASTER_TRACKING.md with completed tasks
   - Update PROJECT_STATUS.md if major feature
   - Check off items in ROADMAP.md if applicable

2. **Feature Documentation** (docs/features/)
   - Update FEATURE_MATRIX.md with new feature status
   - Create feature-specific doc if complex
   - Update implementation notes

3. **Architecture** (docs/architecture/)
   - Update diagrams if structure changed
   - Document new patterns introduced
   - Update API documentation

4. **Platform Specific** (docs/platforms/)
   - Update platform-specific guides
   - Document any platform limitations
   - Add deployment notes
```

#### 4.2 Enhanced Project Summary
Generate `docs/features/Summary_{ProjectName}.md`:
```markdown
# {ProjectName} Implementation Summary

## Overview
- **Date**: {Date}
- **Sprint**: {From MASTER_TRACKING.md}
- **Duration**: {Time spent}
- **Documentation Updated**: {List of updated docs}

## Implementation Details

### Requirements Source
- User Story: {Reference}
- Documentation: {Links to relevant docs}
- Feature Matrix Entry: {Link to FEATURE_MATRIX.md section}

### Architecture Impact
- Components Modified: {List with links}
- Database Changes: {If any, ref DATABASE_SCHEMA.md}
- API Changes: {If any, ref API docs}

### Code Changes
- Files Modified: {Count and categorized list}
- Lines Added/Removed: {Stats}
- Test Coverage: {Before/After}

### Testing Results
| Test Type | Passed | Failed | Coverage |
|-----------|--------|--------|----------|
| Unit      | X      | 0      | XX%      |
| Integration| X     | 0      | XX%      |
| E2E       | X      | 0      | XX%      |

### Performance Impact
- Bundle Size: {Before → After}
- Load Time: {Before → After}
- API Response: {Average time}

### Documentation Updates
- [ ] MASTER_TRACKING.md updated
- [ ] FEATURE_MATRIX.md updated
- [ ] Platform docs updated
- [ ] API docs updated
- [ ] CHANGELOG updated

### Next Steps
1. Monitor feature adoption (analytics)
2. Gather user feedback
3. Plan iterations based on usage

### Lessons Learned
- What worked well
- Challenges encountered
- Recommendations for similar features
```

## Execution Patterns with Documentation

### Pattern 1: Feature Implementation
```
1. Check ROADMAP.md → 2. Review FEATURE_MATRIX.md → 3. Read ARCHITECTURE_OVERVIEW.md →
4. Implement per DEVELOPMENT_GUIDE.md → 5. Test per standards → 6. Update all docs
```

### Pattern 2: Bug Fix
```
1. Check issue in MASTER_TRACKING.md → 2. Review related docs → 3. Fix per CLAUDE_GUIDE.md →
4. Add tests → 5. Update documentation → 6. Close issue
```

### Pattern 3: Refactoring
```
1. Document current state → 2. Check ARCHITECTURE_OVERVIEW.md → 3. Plan per best practices →
4. Implement incrementally → 5. Update all affected docs → 6. Verify no regressions
```

## Enhanced Best Practices

### DO:
- ✅ Always start by reading relevant docs/
- ✅ Create specialized agents for complex tasks
- ✅ Reference documentation in code comments
- ✅ Update docs as you implement
- ✅ Link commits to documentation sections
- ✅ Use documentation examples as templates
- ✅ Validate against FEATURE_MATRIX.md
- ✅ Follow patterns in DEVELOPMENT_GUIDE.md

### DON'T:
- ❌ Implement without checking docs/features/
- ❌ Ignore architecture constraints in docs/
- ❌ Skip documentation updates
- ❌ Create patterns that conflict with guides
- ❌ Assume feature status without checking
- ❌ Bypass standards in CLAUDE_GUIDE.md

## Documentation-Driven Development

### Before Starting Any Task:
1. **Navigate**: Start at `docs/README.md`
2. **Context**: Read `docs/project-management/PROJECT_STATUS.md`
3. **Goals**: Check `docs/project-management/MASTER_TRACKING.md`
4. **Standards**: Review `docs/development/CLAUDE_GUIDE.md`
5. **Architecture**: Understand via `docs/architecture/ARCHITECTURE_OVERVIEW.md`
6. **Features**: Verify in `docs/features/FEATURE_MATRIX.md`

### During Implementation:
- Reference documentation in code comments
- Follow examples from guides
- Update docs immediately when patterns change
- Create new docs for complex features

### After Completion:
- Update all affected documentation
- Ensure cross-references are valid
- Add lessons learned
- Update feature status

## Success Criteria with Documentation

A task is complete when:
1. ✅ Requirements from docs/project-management/ are met
2. ✅ Tests pass per docs/development/ standards
3. ✅ Architecture follows docs/architecture/ patterns
4. ✅ Feature matrix in docs/features/ is updated
5. ✅ Design matches docs/design/ specifications
6. ✅ Performance meets docs/analytics/ metrics
7. ✅ All relevant documentation is updated
8. ✅ User can successfully use the feature

---

**Version**: 3.0.0
**Last Updated**: 2025-01-15
**Optimized for**: Documentation-driven development with dynamic agent creation
**Documentation Root**: `/docs/README.md`