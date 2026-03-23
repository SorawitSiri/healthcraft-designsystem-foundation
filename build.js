import { register } from '@tokens-studio/sd-transforms';
import StyleDictionary from 'style-dictionary';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./config.json', 'utf-8'));

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

const sd = new StyleDictionary(config);
await sd.cleanAllPlatforms();
await sd.buildAllPlatforms();

console.log('\n==============================================');
console.log('\nBuild completed!');