import MUSCLES from './registry/muscles.generated.json';

export function normalizeIds(muscleGroups: string[], synonyms?: Record<string, string>) {
  const map = new Map<string, string>(
    Object.entries(synonyms ?? {}).map(([k, v]) => [k.toLowerCase(), v])
  );
  return Array.from(new Set(
    muscleGroups
      .map(x => x.trim().toLowerCase())
      .map(x => map.get(x) ?? x)
      .filter(x => MUSCLES.all.includes(x))
  )) as any;
}

export function resolveView(ids: string[], view: 'auto'|'split'|'anterior'|'posterior') {
  if (view === 'anterior') return { showAnterior: true, showPosterior: false };
  if (view === 'posterior') return { showAnterior: false, showPosterior: true };
  if (view === 'split')     return { showAnterior: true, showPosterior: true };

  const hasAnt = ids.some(id => MUSCLES.anterior.includes(id));
  const hasPost= ids.some(id => MUSCLES.posterior.includes(id));
  return { showAnterior: hasAnt || !hasPost, showPosterior: hasPost };
}

export function buildRuleSets(ids: string[], intensity?: Partial<Record<string, 0|1|2|3>>) {
  const base =
    `svg [id] { fill: var(--mv-inactive); transition: fill 200ms ease; }`;

  if (!ids.length) return base;

  // Intensity -> alpha multiplier
  const alpha = (lvl?: 0|1|2|3) =>
    ({0: '0.35', 1: '0.55', 2: '0.75', 3: '1'}[lvl ?? 3]);

  const buckets: Record<string, string[]> = {};
  for (const id of ids) {
    const a = alpha(intensity?.[id as any]);
    buckets[a] ||= [];
    buckets[a].push(`#${id}`);
  }

  const rules = Object.entries(buckets)
    .map(([a, sels]) => `${sels.join(', ')} { fill: color-mix(in srgb, var(--mv-highlight) ${parseFloat(a)*100}%, transparent); }`)
    .join('\n');

  return `${base}\n${rules}`;
}
