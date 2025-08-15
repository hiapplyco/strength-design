import React, { useMemo } from 'react';
import AnteriorSVG from './anatomy/anterior-body.svg?react';
import PosteriorSVG from './anatomy/posterior-body.svg?react';
import { resolveView, normalizeIds, buildRuleSets } from './utils';
import './styles.css';
import { MuscleId } from './registry/muscles.generated';

export const DEFAULT_HIGHLIGHT = 'hsl(340 85% 63%)';
export const DEFAULT_INACTIVE  = 'hsl(0 0% 90%)';

type ViewMode = 'anterior' | 'posterior' | 'auto' | 'split';

type IntensityMap = Partial<Record<MuscleId, 0|1|2|3>>;

interface MuscleVisualizerProps {
  muscleGroups: MuscleId[];
  view?: ViewMode;                 // default: 'auto'
  intensity?: IntensityMap;        // optional 0-3 tints
  highlightColor?: string;         // CSS color, default: hsl(340 85% 63%)
  inactiveColor?: string;          // default: hsl(0 0% 90%)
  showLabels?: boolean;            // overlay readable labels
  interactive?: boolean;           // allow hover/focus
  synonyms?: Record<string, MuscleId>; // map 'pecs' -> 'chest', etc.
  className?: string;
  style?: React.CSSProperties;
  onSelectMuscle?: (id: MuscleId) => void;
}

export default function MuscleVisualizer({
  muscleGroups,
  view = 'auto',
  intensity,
  highlightColor = DEFAULT_HIGHLIGHT,
  inactiveColor = DEFAULT_INACTIVE,
  showLabels = false,
  interactive = false,
  synonyms,
  className,
  style,
  onSelectMuscle
}: MuscleVisualizerProps) {

  const ids = useMemo(
    () => normalizeIds(muscleGroups, synonyms),
    [muscleGroups, synonyms]
  );

  const { showAnterior, showPosterior } = useMemo(
    () => resolveView(ids, view),
    [ids, view]
  );

  const css = useMemo(
    () => buildRuleSets(ids, intensity),
    [ids, intensity]
  );

  const rootStyle: React.CSSProperties = {
    // make colors themeable without re-computation
    ['--mv-highlight' as any]: highlightColor,
    ['--mv-inactive' as any]: inactiveColor,
    ...style
  };

  const handleClick = (e: React.MouseEvent<SVGElement>) => {
    if (!interactive || !onSelectMuscle) return;
    const el = e.target as SVGElement;
    const candidate = el.closest('[id]') as SVGElement | null;
    const id = candidate?.id as string | undefined;
    if (id && ids.includes(id as any)) onSelectMuscle(id as any);
  };

  return (
    <div className={`mv-root ${className ?? ''}`} style={rootStyle}>
      <style>{css}</style>

      <div className={`mv-canvas ${showPosterior ? 'mv-split' : ''}`}>
        {showAnterior && (
          <div className="mv-pane" aria-label="Anterior view">
            <AnteriorSVG className="mv-svg" onClick={handleClick} />
            {showLabels && <Labels forView="anterior" activeIds={ids} />}
          </div>
        )}
        {showPosterior && (
          <div className="mv-pane" aria-label="Posterior view">
            <PosteriorSVG className="mv-svg" onClick={handleClick} />
            {showLabels && <Labels forView="posterior" activeIds={ids} />}
          </div>
        )}
      </div>
    </div>
  );
}

// Basic label overlay, optional (implementation left concise for brevity)
function Labels({ forView, activeIds }: { forView: 'anterior'|'posterior'; activeIds: string[] }) {
  return <div className="mv-label-layer" data-view={forView} />;
}
