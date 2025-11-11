// This script would generate a TypeScript file from the JSON registry.
import fs from 'fs';
import path from 'path';

const registryDir = path.resolve(process.cwd(), 'src/components/MuscleVisualizer/registry');

const jsonPath = path.join(registryDir, 'muscles.generated.json');
const tsPath = path.join(registryDir, 'muscles.generated.ts');

const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
const muscleData = JSON.parse(jsonContent);

const muscleIds = muscleData.all;

const tsContent = `export const MUSCLES = ${JSON.stringify(muscleIds, null, 2)} as const;
export type MuscleId = typeof MUSCLES[number];
`;

fs.writeFileSync(tsPath, tsContent);

console.log('✅ Generated muscles.generated.ts');
