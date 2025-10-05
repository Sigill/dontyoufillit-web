import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin'
import { defineConfig } from 'eslint/config';

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
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
  },
  {
    plugins: {
      "@stylistic": stylistic,
    },
    rules: {
      "@stylistic/quote-props": [ "error", "consistent-as-needed" ],
      "@stylistic/indent": ["error", 2, {
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
        SwitchCase: 1,
      }],
    }
  },
  {
    files: ["**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-unused-expressions": "off", // Otherwise expect(something).to.exist is considered as an unused expression.
    }
  }
);
