// This script would parse SVG files and extract IDs.
// For the purpose of this exercise, we'll create a placeholder.
import fs from 'fs';
import path from 'path';

const anatomyDir = path.resolve(process.cwd(), 'src/components/MuscleVisualizer/anatomy');
const registryDir = path.resolve(process.cwd(), 'src/components/MuscleVisualizer/registry');

const anteriorSvgPath = path.join(anatomyDir, 'anterior-body.svg');
const posteriorSvgPath = path.join(anatomyDir, 'posterior-body.svg');


// In a real implementation, you'd use a library like 'cheerio' or 'jsdom'
// to parse the SVG and extract the IDs.
// For now, we'll just create a dummy file.

const generatedJson = {
    "all": ["abdominals","chest","triceps", "shoulders-anterior", "quadriceps","glutes","hamstrings","erectors", "lats"],
    "anterior": ["abdominals","chest", "shoulders-anterior", "quadriceps"],
    "posterior": ["triceps","lats", "glutes", "hamstrings", "erectors"]
};

fs.writeFileSync(path.join(registryDir, 'muscles.generated.json'), JSON.stringify(generatedJson, null, 2));

console.log('✅ Generated muscles.generated.json');
