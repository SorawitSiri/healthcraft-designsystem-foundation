import { register } from '@tokens-studio/sd-transforms';
import StyleDictionary from 'style-dictionary';

register(StyleDictionary, {
  excludeParentKeys: true,
});

// Figma exports dimension tokens as $type: "number" instead of "dimension",
// so the built-in size/px transform skips them. This custom transform
// appends "px" to number-type tokens that represent pixel values.
StyleDictionary.registerTransform({
  name: 'number/px',
  type: 'value',
  filter: (token) => {
    return token.$type === 'number' && typeof token.$value === 'number' && token.$value !== 0;
  },
  transform: (token) => `${token.$value}px`,
});

// Shared token sources (non-color semantics, primitives, etc.)
const sharedSources = [
  'tokens/Semantic-Core/Baseline.json',
  'tokens/Semantic-Typescale/*.json',
  'tokens/Component Layer/*.json',
  'tokens/Primitive-Color/*.json',
  'tokens/Primitive-Core/*.json',
  'tokens/Theme-Mode (Primitive)/*.json',
];

const platformBase = {
  transformGroup: 'tokens-studio',
  transforms: ['number/px'],
  buildPath: 'build/css/',
};

// Light mode — Semantic-Color/Baseline.json
const sdLight = new StyleDictionary({
  source: [...sharedSources, 'tokens/Semantic-Color/Baseline.json'],
  platforms: {
    css: {
      ...platformBase,
      files: [
        {
          destination: 'tokens-light.css',
          format: 'css/variables',
          options: { outputReferences: false },
        },
      ],
    },
  },
});

// Dark mode — Semantic-Color/Dark Mode.json
const sdDark = new StyleDictionary({
  source: [...sharedSources, 'tokens/Semantic-Color/Dark Mode.json'],
  platforms: {
    css: {
      ...platformBase,
      files: [
        {
          destination: 'tokens-dark.css',
          format: 'css/variables',
          options: {
            outputReferences: false,
            selector: '[data-theme="dark"]',
          },
        },
      ],
    },
  },
});

await sdLight.cleanAllPlatforms();
await sdDark.cleanAllPlatforms();
await sdLight.buildAllPlatforms();
await sdDark.buildAllPlatforms();

console.log('\n==============================================');
console.log('\nBuild completed!');
