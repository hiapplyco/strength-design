
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { WorkoutGenerating } from '@/components/ui/loading-states';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { cn } from '@/lib/utils';
import { 
  colors, 
  typography, 
  spacing, 
  sizes, 
  radius, 
  shadows,
  variants
} from '@/lib/design-tokens';

export default function DesignSystemPlayground() {
  const [showLoading, setShowLoading] = React.useState(false);

  return (
    <StandardPageLayout
      title="Design System Playground"
      description="Explore and test the Strength.Design design system components"
    >
      {/* Typography Section */}
      <section className={spacing.margin.section}>
        <h2 className={cn(typography.display.h3, spacing.margin.element)}>Typography</h2>
        <Card variant="flat">
          <CardContent className={spacing.component.lg}>
            <div className={spacing.gap.lg}>
              <h1 className={typography.display.h1}>Display H1</h1>
              <h2 className={typography.display.h2}>Display H2</h2>
              <h3 className={typography.display.h3}>Display H3</h3>
              <h4 className={typography.display.h4}>Display H4</h4>
              <h5 className={typography.display.h5}>Display H5</h5>
              <h6 className={typography.display.h6}>Display H6</h6>
              <p className={typography.body.large}>Large body text for emphasis</p>
              <p className={typography.body.default}>Default body text for general content</p>
              <p className={typography.body.small}>Small body text for secondary information</p>
              <p className={typography.caption}>Caption text for labels and hints</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Colors Section */}
      <section className={spacing.margin.section}>
        <h2 className={cn(typography.display.h3, spacing.margin.element)}>Colors</h2>
        <div className={cn("grid grid-cols-2 md:grid-cols-4", spacing.gap.md)}>
          <Card variant="flat">
            <CardContent className={spacing.component.md}>
              <div className="w-full h-20 rounded bg-primary mb-2" />
              <p className={typography.label}>Primary</p>
              <p className={typography.caption}>{colors.primary.DEFAULT}</p>
            </CardContent>
          </Card>
          <Card variant="flat">
            <CardContent className={spacing.component.md}>
              <div className="w-full h-20 rounded bg-success mb-2" />
              <p className={typography.label}>Success</p>
              <p className={typography.caption}>{colors.success.DEFAULT}</p>
            </CardContent>
          </Card>
          <Card variant="flat">
            <CardContent className={spacing.component.md}>
              <div className="w-full h-20 rounded bg-warning mb-2" />
              <p className={typography.label}>Warning</p>
              <p className={typography.caption}>{colors.warning.DEFAULT}</p>
            </CardContent>
          </Card>
          <Card variant="flat">
            <CardContent className={spacing.component.md}>
              <div className="w-full h-20 rounded bg-destructive mb-2" />
              <p className={typography.label}>Danger</p>
              <p className={typography.caption}>{colors.danger.DEFAULT}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Card Variants Section */}
      <section className={spacing.margin.section}>
        <h2 className={cn(typography.display.h3, spacing.margin.element)}>Card Variants</h2>
        <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3", spacing.gap.md)}>
          <Card variant="default">
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={typography.body.default}>
                Features gradient border effect
              </p>
            </CardContent>
          </Card>
          
          <Card variant="ghost">
            <CardHeader>
              <CardTitle>Ghost Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={typography.body.default}>
                Subtle with backdrop blur
              </p>
            </CardContent>
          </Card>
          
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Elevated Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={typography.body.default}>
                Strong shadow for emphasis
              </p>
            </CardContent>
          </Card>
          
          <Card variant="interactive">
            <CardHeader>
              <CardTitle>Interactive Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={typography.body.default}>
                Hover me for effect
              </p>
            </CardContent>
          </Card>
          
          <Card variant="flat">
            <CardHeader>
              <CardTitle>Flat Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={typography.body.default}>
                Simple bordered style
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Buttons Section */}
      <section className={spacing.margin.section}>
        <h2 className={cn(typography.display.h3, spacing.margin.element)}>Buttons</h2>
        <Card variant="flat">
          <CardContent className={spacing.component.lg}>
            <div className={spacing.gap.lg}>
              {/* Button Variants */}
              <div>
                <h3 className={cn(typography.label, spacing.margin.text)}>Variants</h3>
                <div className={cn("flex flex-wrap", spacing.gap.sm)}>
                  <Button variant="default">Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                  <Button variant="destructive">Destructive</Button>
                </div>
              </div>
              
              {/* Button Sizes */}
              <div>
                <h3 className={cn(typography.label, spacing.margin.text)}>Sizes</h3>
                <div className={cn("flex flex-wrap items-center", spacing.gap.sm)}>
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon" variant="outline">
                    <span className={sizes.icon.sm}>🎯</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Badges Section */}
      <section className={spacing.margin.section}>
        <h2 className={cn(typography.display.h3, spacing.margin.element)}>Badges</h2>
        <Card variant="flat">
          <CardContent className={spacing.component.lg}>
            <div className={cn("flex flex-wrap", spacing.gap.sm)}>
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="default">Warning</Badge>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Loading States Section */}
      <section className={spacing.margin.section}>
        <h2 className={cn(typography.display.h3, spacing.margin.element)}>Loading States</h2>
        <div className={cn("grid grid-cols-1 md:grid-cols-2", spacing.gap.md)}>
          <Card variant="flat">
            <CardHeader>
              <CardTitle>Loading Indicators</CardTitle>
            </CardHeader>
            <CardContent className={spacing.gap.md}>
              <LoadingIndicator size="small" variant="default">
                Small default
              </LoadingIndicator>
              <LoadingIndicator size="medium" variant="primary">
                Medium primary
              </LoadingIndicator>
              <LoadingIndicator size="large" variant="muted">
                Large muted
              </LoadingIndicator>
            </CardContent>
          </Card>
          
          <Card variant="flat">
            <CardHeader>
              <CardTitle>Workout Generating Animation</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setShowLoading(!showLoading)}
                className="mb-4"
              >
                {showLoading ? 'Hide' : 'Show'} Animation
              </Button>
              {showLoading && <WorkoutGenerating />}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Spacing Section */}
      <section className={spacing.margin.section}>
        <h2 className={cn(typography.display.h3, spacing.margin.element)}>Spacing</h2>
        <Card variant="flat">
          <CardContent className={spacing.component.lg}>
            <div className={spacing.gap.lg}>
              <div>
                <p className={typography.label}>Gap XS</p>
                <div className={cn("flex bg-muted rounded", spacing.gap.xs)}>
                  <div className="bg-primary p-4 rounded" />
                  <div className="bg-primary p-4 rounded" />
                  <div className="bg-primary p-4 rounded" />
                </div>
              </div>
              <div>
                <p className={typography.label}>Gap SM</p>
                <div className={cn("flex bg-muted rounded", spacing.gap.sm)}>
                  <div className="bg-primary p-4 rounded" />
                  <div className="bg-primary p-4 rounded" />
                  <div className="bg-primary p-4 rounded" />
                </div>
              </div>
              <div>
                <p className={typography.label}>Gap MD</p>
                <div className={cn("flex bg-muted rounded", spacing.gap.md)}>
                  <div className="bg-primary p-4 rounded" />
                  <div className="bg-primary p-4 rounded" />
                  <div className="bg-primary p-4 rounded" />
                </div>
              </div>
              <div>
                <p className={typography.label}>Gap LG</p>
                <div className={cn("flex bg-muted rounded", spacing.gap.lg)}>
                  <div className="bg-primary p-4 rounded" />
                  <div className="bg-primary p-4 rounded" />
                  <div className="bg-primary p-4 rounded" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Shadows Section */}
      <section className={spacing.margin.section}>
        <h2 className={cn(typography.display.h3, spacing.margin.element)}>Shadows</h2>
        <div className={cn("grid grid-cols-2 md:grid-cols-4", spacing.gap.md)}>
          <div className={cn("bg-background rounded p-4", shadows.sm)}>
            <p className={typography.label}>Shadow SM</p>
          </div>
          <div className={cn("bg-background rounded p-4", shadows.md)}>
            <p className={typography.label}>Shadow MD</p>
          </div>
          <div className={cn("bg-background rounded p-4", shadows.lg)}>
            <p className={typography.label}>Shadow LG</p>
          </div>
          <div className={cn("bg-background rounded p-4", shadows.xl)}>
            <p className={typography.label}>Shadow XL</p>
          </div>
        </div>
      </section>

      {/* Border Radius Section */}
      <section className={spacing.margin.section}>
        <h2 className={cn(typography.display.h3, spacing.margin.element)}>Border Radius</h2>
        <div className={cn("grid grid-cols-3 md:grid-cols-6", spacing.gap.md)}>
          <div className={cn("bg-primary p-8", radius.none)}>
            <p className="text-white text-xs">None</p>
          </div>
          <div className={cn("bg-primary p-8", radius.sm)}>
            <p className="text-white text-xs">SM</p>
          </div>
          <div className={cn("bg-primary p-8", radius.md)}>
            <p className="text-white text-xs">MD</p>
          </div>
          <div className={cn("bg-primary p-8", radius.lg)}>
            <p className="text-white text-xs">LG</p>
          </div>
          <div className={cn("bg-primary p-8", radius.xl)}>
            <p className="text-white text-xs">XL</p>
          </div>
          <div className={cn("bg-primary p-8", radius.full)}>
            <p className="text-white text-xs">Full</p>
          </div>
        </div>
      </section>
    </StandardPageLayout>
  );
}
