# healthcraft-designsystem-foundation
## Installation
```
npm install -y
npm install style-dictionary --save-dev

npm install @tokens-studio/sd-transforms
```

## Run
Note: Must check `config.json`
```
{
  "source": [
    "tokens/Semantic-Color/*.json",
    "tokens/Semantic-Core/*.json",
    "tokens/Semantic-Typescale/*.json",
    "tokens/Component Layer/*.json",
    "tokens/Primitive-Color/*.json",
    "tokens/Primitive-Core/*.json",
    "tokens/Theme-Mode (Primitive)/*.json"
  ],
  "platforms": {
    "css": {
      "transformGroup": "tokens-studio",
      "buildPath": "build/css/",
      "files": [
        {
          "destination": "tokens.css",
          "format": "css/variables"
        }
      ]
    }
  }
}
```
```
npm run build
```