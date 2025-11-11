# Muscle Anatomy Tools

This package contains scripts for processing and validating the muscle anatomy SVG assets.

## Scripts

- `extract-ids.ts`: Extracts muscle IDs from the SVG files and generates `muscles.generated.json`.
- `generate-registry.ts`: Generates `muscles.generated.ts` from `muscles.generated.json`.
- `validate-ids.ts`: Validates the muscle IDs in the SVG files.

## Usage

```bash
yarn anatomy:extract
yarn anatomy:gen
yarn anatomy:validate
```
