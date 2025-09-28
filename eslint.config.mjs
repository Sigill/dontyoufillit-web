import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';

export default defineConfig(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      indent: ["error", 2, {
        VariableDeclarator: "first",

        FunctionDeclaration: {
          parameters: "first",
        },

        FunctionExpression: {
          parameters: "first",
        },

        CallExpression: {
          arguments: "first",
        },

        ArrayExpression: "first",
        ObjectExpression: "first",
        ImportDeclaration: "first",
        MemberExpression: 1,
      }],

      "linebreak-style": ["error", "unix"],
      semi: ["error", "always"],
      eqeqeq: ["error", "smart"],
      "no-template-curly-in-string": ["error"],
      "multiline-ternary": ["error", "always-multiline"],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-expressions": [
        "error",
        {
          "allowShortCircuit": true, // Allows verbose && console.log().
        }
      ]
    },
  }
);
