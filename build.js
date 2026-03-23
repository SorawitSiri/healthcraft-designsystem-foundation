import { register } from '@tokens-studio/sd-transforms';
import StyleDictionary from 'style-dictionary';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

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

// Convert a boxShadow object/array to a CSS box-shadow string
function shadowToCSS(val) {
  if (Array.isArray(val)) return val.map(shadowToCSS).join(', ');
  if (typeof val === 'object' && val !== null) {
    const x = val.x ?? val.offsetX ?? 0;
    const y = val.y ?? val.offsetY ?? 0;
    const blur = val.blur ?? 0;
    const spread = val.spread ?? 0;
    const color = val.color ?? '#000';
    const inset = val.type === 'innerShadow' ? 'inset ' : '';
    return `${inset}${x}px ${y}px ${blur}px ${spread}px ${color}`;
  }
  return val;
}

// Generate CSS variable lines from a token list
function tokenToCSS(token) {
  const name = token.name;
  let value = token.$value ?? token.value;
  if (typeof value === 'object' && value !== null) {
    value = shadowToCSS(value);
  }
  let line = `  --${name}: ${value};`;
  if (name.endsWith('FontSize') && typeof value === 'string' && value.endsWith('px')) {
    const px = parseFloat(value);
    const rem = +(px / 16).toFixed(4);
    line += `\n  --${name}Rem: ${rem}rem;`;
  }
  return line;
}

// Format: all CSS variables under :root
StyleDictionary.registerFormat({
  name: 'css/variables-with-rem',
  format: ({ dictionary, options }) => {
    const selector = options.selector || ':root';
    const lines = dictionary.allTokens.map(tokenToCSS);
    return `${selector} {\n${lines.join('\n')}\n}\n`;
  },
});

// Format: only typescale tokens, wrapped in a @media query
StyleDictionary.registerFormat({
  name: 'css/typescale-media',
  format: ({ dictionary, options }) => {
    const tokens = dictionary.allTokens.filter(
      (t) => t.filePath.includes('Semantic-Typescale'),
    );
    if (tokens.length === 0) return '';
    // tokenToCSS returns lines with 2-space indent; add 2 more for @media > :root nesting
    const lines = tokens.map((t) => tokenToCSS(t).replace(/\n  /g, '\n    '));
    return `@media (max-width: ${options.breakpoint}) {\n  :root {\n  ${lines.join('\n  ')}\n  }\n}\n`;
  },
});

// ---------- Sources ----------

// Base sources (everything except Typescale)
const baseSources = [
  'tokens/Semantic-Core/*.json',
  'tokens/Component Layer/*.json',
  'tokens/Primitive-Color/*.json',
  'tokens/Primitive-Core/*.json',
  'tokens/Theme-Mode (Primitive)/*.json',
  'tokens/Semantic-Color/Baseline.json',
];

const platformBase = {
  transformGroup: 'tokens-studio',
  transforms: ['number/px'],
  buildPath: 'build/css/',
};

const logConfig = {
  verbosity: 'verbose',
  errors: { brokenReferences: 'console' },
};

// ---------- Build ----------

// 1) Desktop = default :root (all tokens + Desktop typescale)
const sdDesktop = new StyleDictionary({
  log: logConfig,
  source: [...baseSources, 'tokens/Semantic-Typescale/Desktop.json'],
  platforms: {
    css: {
      ...platformBase,
      files: [
        {
          destination: '_desktop.css',
          format: 'css/variables-with-rem',
          options: { outputReferences: false },
        },
      ],
    },
  },
});

// 2) Tablet override (only typescale tokens differ)
const sdTablet = new StyleDictionary({
  log: logConfig,
  source: [...baseSources, 'tokens/Semantic-Typescale/Tablet.json'],
  platforms: {
    css: {
      ...platformBase,
      files: [
        {
          destination: '_tablet.css',
          format: 'css/typescale-media',
          options: { outputReferences: false, breakpoint: '1024px' },
        },
      ],
    },
  },
});

// 3) Mobile override (only typescale tokens differ)
const sdMobile = new StyleDictionary({
  log: logConfig,
  source: [...baseSources, 'tokens/Semantic-Typescale/Mobile.json'],
  platforms: {
    css: {
      ...platformBase,
      files: [
        {
          destination: '_mobile.css',
          format: 'css/typescale-media',
          options: { outputReferences: false, breakpoint: '768px' },
        },
      ],
    },
  },
});

// Clean old output
await sdDesktop.cleanAllPlatforms();

// Build all three
await Promise.all([
  sdDesktop.buildAllPlatforms(),
  sdTablet.buildAllPlatforms(),
  sdMobile.buildAllPlatforms(),
]);

// Combine into a single file
mkdirSync('build/css', { recursive: true });
const header = '/**\n * Do not edit directly, this file was auto-generated.\n */\n\n';
const desktop = readFileSync('build/css/_desktop.css', 'utf8');
const tablet = readFileSync('build/css/_tablet.css', 'utf8');
const mobile = readFileSync('build/css/_mobile.css', 'utf8');

writeFileSync('build/css/tokens-light.css', header + desktop + '\n' + tablet + '\n' + mobile);

// Clean up temp files
import { unlinkSync } from 'fs';
unlinkSync('build/css/_desktop.css');
unlinkSync('build/css/_tablet.css');
unlinkSync('build/css/_mobile.css');

console.log('\n==============================================');
console.log('\nBuild completed!');
