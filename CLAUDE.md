# Strength.Design - AI Claude Development Guide & Design System

## Project Overview

Strength.Design is an AI-powered fitness platform that creates personalized workout plans through conversational interfaces. This document serves as the comprehensive development guide for Claude, including our design system, architectural patterns, and implementation standards.

**Core Mission**: Create a cohesive, emotionally engaging, and visually consistent fitness companion that delights users through thoughtful design and intelligent AI interactions.

## Table of Contents
1. [Design System](#design-system)
2. [Development Setup](#development-setup)
3. [Architecture & Patterns](#architecture--patterns)
4. [Feature Implementation](#feature-implementation)
5. [Testing & Quality](#testing--quality)
6. [Deployment](#deployment)

## Design System

### Design Principles
1. **Consistency First**: Every component follows the same patterns
2. **Accessibility Always**: WCAG 2.1 AA compliance minimum
3. **Performance Matters**: Lazy load, optimize, and measure
4. **Mobile Native**: Touch-first, responsive by default
5. **Delightful Motion**: Purposeful animations that enhance UX

### Visual Foundation

#### Color System
```typescript
// src/lib/design-tokens.ts
export const colors = {
  // Brand Colors
  primary: {
    DEFAULT: "hsl(25 95% 53%)",        // Warm orange - sunset inspired
    foreground: "hsl(0 0% 100%)",      // White text on primary
    50: "hsl(25 95% 95%)",
    100: "hsl(25 95% 90%)",
    // ... full scale
  },
  
  // Semantic Colors
  success: {
    DEFAULT: "hsl(142 71% 45%)",       // Green for achievements
    light: "hsl(142 71% 95%)",
  },
  
  // Gradient System
  gradients: {
    border: "from-[#4CAF50] via-[#9C27B0] to-[#FF1493]",
    sunset: "from-orange-400 via-red-500 to-pink-500",
    energy: "from-yellow-400 via-orange-500 to-red-500",
  }
}
```

#### Typography Scale
```typescript
// Consistent type scale using Tailwind utilities
export const typography = {
  // Display
  h1: "text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight",
  h2: "text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight",
  h3: "text-2xl sm:text-3xl lg:text-4xl font-semibold",
  h4: "text-xl sm:text-2xl lg:text-3xl font-medium",
  h5: "text-lg sm:text-xl lg:text-2xl font-medium",
  h6: "text-base sm:text-lg lg:text-xl font-medium",
  
  // Body
  body: "text-sm sm:text-base",
  bodyLarge: "text-base sm:text-lg",
  bodySmall: "text-xs sm:text-sm",
  
  // Special
  label: "text-sm font-medium",
  caption: "text-xs text-muted-foreground",
  button: "text-sm font-medium",
}
```

#### Spacing System
```typescript
// Consistent spacing tokens
export const spacing = {
  // Component padding
  component: {
    xs: "p-2",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  },
  
  // Page sections
  section: {
    mobile: "py-4 px-4",
    tablet: "py-6 px-6",
    desktop: "py-8 px-8",
  },
  
  // Gaps
  gap: {
    xs: "gap-2",
    sm: "gap-3",
    md: "gap-4",
    lg: "gap-6",
    xl: "gap-8",
  }
}
```

#### Component Variants

##### Card System
```typescript
// Unified card variants
export const cardVariants = {
  // Base card with gradient border
  default: cn(
    "relative rounded-md bg-card text-card-foreground shadow-sm overflow-hidden",
    "before:absolute before:inset-0 before:rounded-md",
    "before:bg-gradient-to-r before:from-[#4CAF50] before:via-[#9C27B0] before:to-[#FF1493]",
    "before:p-[1px] before:-z-10",
    "after:absolute after:inset-[1px] after:rounded-[calc(0.375rem-1px)]",
    "after:bg-card after:-z-[5]"
  ),
  
  // Ghost card for subtle UI
  ghost: "rounded-md bg-card/50 backdrop-blur-sm border border-border/50",
  
  // Elevated card for important content
  elevated: "rounded-md bg-card shadow-lg border border-border/20",
  
  // Interactive card
  interactive: cn(
    "rounded-md bg-card border border-border/50",
    "transition-all duration-200",
    "hover:border-primary/50 hover:shadow-md hover:scale-[1.02]"
  ),
}
```

##### Button System
```typescript
// Consistent button usage
export const buttonGuidelines = {
  // Primary actions: Save, Submit, Generate
  primary: "variant='default' size='default'",
  
  // Secondary actions: Cancel, Back
  secondary: "variant='outline' size='default'",
  
  // Destructive actions: Delete, Remove
  destructive: "variant='destructive' size='default'",
  
  // Navigation: Links, breadcrumbs
  navigation: "variant='ghost' size='sm'",
  
  // Icon-only buttons
  icon: "variant='ghost' size='icon'",
}
```

### Component Library

#### Layout Components

##### StandardPageLayout
**Usage**: Wrap ALL page content
```tsx
<StandardPageLayout
  title="Page Title"
  description="Optional description"
  showBack={true}
  rightAction={<Button>Action</Button>}
>
  {/* Page content */}
</StandardPageLayout>
```

##### SectionContainer
**Usage**: Group related content
```tsx
<SectionContainer
  title="Section Title"
  variant="default" // default | ghost | bordered
  spacing="md" // xs | sm | md | lg | xl
>
  {/* Section content */}
</SectionContainer>
```

#### Data Display

##### DataCard
**Usage**: Display metrics and stats
```tsx
<DataCard
  title="Total Workouts"
  value="156"
  change="+12%"
  icon={<Dumbbell />}
  variant="default" // default | success | warning | danger
/>
```

##### EmptyState
**Usage**: When no data is available
```tsx
<EmptyState
  icon={<FileText />}
  title="No workouts yet"
  description="Generate your first workout to get started"
  action={
    <Button onClick={handleCreate}>
      Create Workout
    </Button>
  }
/>
```

#### Feedback Components

##### LoadingState
**Usage**: During async operations
```tsx
<LoadingState
  variant="spinner" // spinner | skeleton | progress
  message="Generating your workout..."
  progress={0.45} // For progress variant
/>
```

##### Toast Patterns
```typescript
// Consistent toast usage
toast.success("Workout saved successfully!");
toast.error("Failed to generate workout. Please try again.");
toast.info("Tip: Add more exercises for a complete workout");
toast.loading("Analyzing your form...");
```

### Animation Guidelines

#### Micro-interactions
```typescript
// Framer Motion presets
export const animations = {
  // Page transitions
  pageIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.2 }
  },
  
  // Component animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.2 }
  },
  
  // Interactive elements
  tap: {
    whileTap: { scale: 0.98 },
    transition: { duration: 0.1 }
  },
  
  // Loading sequences
  pulse: {
    animate: { scale: [1, 1.05, 1] },
    transition: { repeat: Infinity, duration: 2 }
  }
}
```

### Responsive Design

#### Breakpoint System
```typescript
// Mobile-first responsive utilities
export const responsive = {
  // Hide/Show
  hideOnMobile: "hidden sm:block",
  showOnMobile: "block sm:hidden",
  
  // Grid layouts
  grid: {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  },
  
  // Container widths
  container: {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
  }
}
```

#### Touch Optimization
```typescript
// Touch-friendly sizing
export const touch = {
  // Minimum touch target: 44x44px
  target: "min-w-[44px] min-h-[44px]",
  
  // Icon buttons
  iconButton: "w-10 h-10 sm:w-9 sm:h-9",
  
  // Interactive elements
  interactive: "p-3 -m-1", // Increases touch area
}
```

## Development Setup

### Prerequisites
```bash
# Required versions
Node.js 18+
npm 9+
Supabase CLI
```

### Initial Setup
```bash
# Clone and install
git clone https://github.com/yourusername/strength-design.git
cd strength-design
npm install

# Environment setup
cp .env.example .env.local
# Add your keys to .env.local

# Database setup
npx supabase start
npx supabase db push
npx supabase gen types
```

### Development Commands
```bash
# Start development
npm run dev

# Run tests
npm test
npm run test:watch
npm run test:coverage

# Code quality
npm run lint
npm run lint:fix
npm run typecheck
npm run format

# Build
npm run build
npm run preview
```

## Architecture & Patterns

### Directory Structure
```
src/
├── components/
│   ├── ui/               # Base UI components (shadcn)
│   ├── layout/           # Layout components
│   ├── workout/          # Workout-specific components
│   ├── exercise/         # Exercise library components
│   └── shared/           # Shared/common components
├── pages/                # Route pages
├── hooks/                # Custom React hooks
├── contexts/             # React contexts
├── lib/                  # Utilities and helpers
├── services/             # API and external services
├── types/                # TypeScript types
└── styles/               # Global styles
```

### Component Patterns

#### Component Structure
```tsx
// components/example/ExampleComponent.tsx
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { animations } from "@/lib/design-tokens";

interface ExampleComponentProps {
  variant?: "default" | "ghost" | "bordered";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
}

export function ExampleComponent({
  variant = "default",
  size = "md",
  className,
  children,
}: ExampleComponentProps) {
  return (
    <motion.div
      {...animations.fadeIn}
      className={cn(
        // Base styles
        "rounded-md",
        // Variant styles
        variants[variant],
        // Size styles
        sizes[size],
        // Custom styles
        className
      )}
    >
      {children}
    </motion.div>
  );
}
```

#### Hook Patterns
```typescript
// hooks/useExample.ts
export function useExample() {
  const [state, setState] = useState();
  
  // Memoized values
  const computedValue = useMemo(() => {
    return expensiveComputation(state);
  }, [state]);
  
  // Callbacks
  const handleAction = useCallback((param: string) => {
    // Handle action
  }, [dependency]);
  
  // Effects
  useEffect(() => {
    // Side effects
    return () => {
      // Cleanup
    };
  }, []);
  
  return {
    state,
    computedValue,
    handleAction,
  };
}
```

### State Management

#### Context Pattern
```tsx
// contexts/ExampleContext.tsx
interface ExampleContextType {
  state: StateType;
  actions: {
    updateState: (value: StateType) => void;
    resetState: () => void;
  };
}

const ExampleContext = createContext<ExampleContextType | undefined>(undefined);

export function ExampleProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StateType>(initialState);
  
  const actions = useMemo(() => ({
    updateState: (value: StateType) => setState(value),
    resetState: () => setState(initialState),
  }), []);
  
  const value = useMemo(() => ({
    state,
    actions,
  }), [state, actions]);
  
  return (
    <ExampleContext.Provider value={value}>
      {children}
    </ExampleContext.Provider>
  );
}

export function useExample() {
  const context = useContext(ExampleContext);
  if (!context) {
    throw new Error("useExample must be used within ExampleProvider");
  }
  return context;
}
```

## Feature Implementation

### Phase 1: Design System Consolidation ✅

#### Task 1.1: Create Design Token System
- Centralize all design tokens in `src/lib/design-tokens.ts`
- Export colors, typography, spacing, animations
- Update all components to use tokens

#### Task 1.2: Standardize Components
- Audit all existing components
- Create variant systems for cards, buttons, inputs
- Ensure consistent prop interfaces

#### Task 1.3: Layout Standardization
- Enforce StandardPageLayout usage
- Create reusable section components
- Implement consistent navigation patterns

### Phase 2: Core Features Enhancement

#### Task 2.1: AI Personality System
```typescript
// Database schema
CREATE TABLE ai_personalities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  voice_tone TEXT CHECK (voice_tone IN ('motivational', 'friendly', 'professional', 'tough-love')),
  custom_phrases TEXT[],
  personality_traits JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

// Integration points
- Chat messages
- Workout generation prompts
- Motivational notifications
- Loading messages
```

#### Task 2.2: Exercise Library Enhancement
```typescript
// Visual exercise system
interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  muscleGroups: MuscleGroup[];
  equipment: Equipment[];
  difficulty: Difficulty;
  media: {
    thumbnail: string;
    video?: string;
    animation?: string;
    images: string[];
  };
  instructions: {
    setup: string[];
    execution: string[];
    tips: string[];
  };
  alternatives: string[]; // Exercise IDs
}
```

#### Task 2.3: Progress Tracking Dashboard
```typescript
// Analytics components
- StrengthProgressChart: Track 1RM progress
- VolumeTracker: Weekly/monthly volume
- ConsistencyCalendar: Workout streaks
- PersonalRecords: PR tracking
- BodyMetrics: Weight, measurements
```

### Phase 3: Engagement Features

#### Task 3.1: Gamification System
```typescript
// Achievement system
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  requirements: AchievementRequirement[];
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// Features
- XP and levels
- Badges and achievements
- Workout streaks
- Social challenges
```

#### Task 3.2: Social Features
```typescript
// Community features
- Share workout templates
- Follow other users
- Like and comment on workouts
- Weekly challenges
- Leaderboards
```

#### Task 3.3: Advanced AI Features
```typescript
// Smart features
- Form check via video analysis
- Auto-progression algorithms
- Fatigue detection
- Nutrition recommendations
- Recovery suggestions
```

## Testing & Quality

### Testing Strategy

#### Unit Testing
```typescript
// Component testing example
describe('WorkoutCard', () => {
  it('renders workout information correctly', () => {
    const workout = mockWorkout();
    render(<WorkoutCard workout={workout} />);
    
    expect(screen.getByText(workout.name)).toBeInTheDocument();
    expect(screen.getByText(`${workout.duration} min`)).toBeInTheDocument();
  });
  
  it('handles click events', async () => {
    const handleClick = jest.fn();
    render(<WorkoutCard workout={mockWorkout()} onClick={handleClick} />);
    
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### Integration Testing
```typescript
// API integration testing
describe('Workout Generation', () => {
  it('generates workout based on user preferences', async () => {
    const preferences = {
      duration: 45,
      equipment: ['dumbbells', 'barbell'],
      goals: ['strength', 'muscle'],
    };
    
    const result = await generateWorkout(preferences);
    
    expect(result.exercises).toHaveLength(6);
    expect(result.duration).toBeLessThanOrEqual(45);
  });
});
```

#### E2E Testing
```typescript
// Playwright E2E tests
test('complete workout flow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // Generate workout
  await page.click('text=Generate Workout');
  await page.selectOption('select[name="duration"]', '45');
  await page.click('text=Generate');
  
  // Verify workout created
  await expect(page.locator('.workout-card')).toBeVisible();
});
```

### Performance Monitoring

#### Web Vitals
```typescript
// Monitor key metrics
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: Metric) {
  // Send to analytics service
  analytics.track('web-vital', {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

#### Bundle Size Monitoring
```json
// package.json
{
  "size-limit": [
    {
      "path": "dist/assets/*.js",
      "limit": "200 KB"
    },
    {
      "path": "dist/assets/*.css",
      "limit": "50 KB"
    }
  ]
}
```

## Deployment

### CI/CD Pipeline

#### GitHub Actions
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
      
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test -- --coverage
      - run: npm run build
      
      - uses: codecov/codecov-action@v3
        if: success()
```

### Environment Configuration

#### Development
```env
# .env.development
VITE_APP_ENV=development
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-key
VITE_ENABLE_DEBUG=true
```

#### Staging
```env
# .env.staging
VITE_APP_ENV=staging
VITE_SUPABASE_URL=https://staging.supabase.co
VITE_SUPABASE_ANON_KEY=your-staging-key
VITE_ENABLE_ANALYTICS=true
```

#### Production
```env
# .env.production
VITE_APP_ENV=production
VITE_SUPABASE_URL=https://prod.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-key
VITE_ENABLE_ANALYTICS=true
VITE_SENTRY_DSN=your-sentry-dsn
```

### Monitoring & Analytics

#### Error Tracking
```typescript
// src/lib/monitoring.ts
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      new BrowserTracing(),
    ],
    tracesSampleRate: 0.1,
    environment: import.meta.env.VITE_APP_ENV,
  });
}
```

#### Analytics Events
```typescript
// src/lib/analytics.ts
export const analytics = {
  // User events
  identify: (userId: string, traits?: Record<string, any>) => {
    if (window.gtag) {
      window.gtag('set', { user_id: userId });
    }
  },
  
  // Track events
  track: (event: string, properties?: Record<string, any>) => {
    if (window.gtag) {
      window.gtag('event', event, properties);
    }
  },
  
  // Page views
  page: (path: string, title?: string) => {
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: path,
        page_title: title,
      });
    }
  },
};
```

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and rebuild
rm -rf node_modules .next dist
npm install
npm run build
```

#### Type Errors
```bash
# Regenerate Supabase types
npx supabase gen types typescript --local > src/types/supabase.ts

# Check for type errors
npm run typecheck
```

#### Performance Issues
```bash
# Analyze bundle
npm run build -- --analyze

# Profile React components
# Enable React DevTools Profiler in development
```

### Debug Tools

#### React Query DevTools
```tsx
// src/App.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <>
      {/* Your app */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </>
  );
}
```

#### Design System Playground
```tsx
// src/pages/DesignSystem.tsx
// Create a page to showcase all components and variants
// Useful for development and documentation
```

## Contributing Guidelines

### Code Style
- Use TypeScript strict mode
- Follow ESLint configuration
- Use Prettier for formatting
- Keep components under 200 lines
- Write tests for new features

### Commit Convention
```bash
# Format: <type>(<scope>): <subject>

feat(workout): add exercise filtering
fix(ui): resolve card gradient on dark mode
docs(readme): update setup instructions
style(button): adjust hover state
refactor(hooks): extract common logic
test(api): add workout generation tests
chore(deps): update dependencies
```

### Pull Request Process
1. Create feature branch from `develop`
2. Write tests for new functionality
3. Update documentation if needed
4. Ensure all tests pass
5. Request review from team members
6. Squash and merge after approval

---

*Last Updated: December 2024*  
*Version: 4.0 - Design System Integration*

## Quick Reference

### Component Checklist
- [ ] Uses StandardPageLayout for pages
- [ ] Follows variant system for cards/buttons
- [ ] Uses design tokens for colors/spacing
- [ ] Includes loading and error states
- [ ] Responsive using utility classes
- [ ] Accessible (keyboard, screen reader)
- [ ] Has unit tests
- [ ] Follows naming conventions

### Performance Checklist
- [ ] Lazy loads heavy components
- [ ] Optimizes images (WebP, sizing)
- [ ] Memoizes expensive computations
- [ ] Debounces user inputs
- [ ] Uses virtual scrolling for lists
- [ ] Minimizes bundle size
- [ ] Implements error boundaries
- [ ] Tracks web vitals

### Accessibility Checklist
- [ ] Semantic HTML elements
- [ ] ARIA labels where needed
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Color contrast passes WCAG
- [ ] Alt text for images
- [ ] Form labels associated
- [ ] Error messages clear