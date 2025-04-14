import eslintPluginJs from "@eslint/js";
import eslintPluginJson from "@eslint/json";
import eslintPluginMarkdown from "@eslint/markdown";
import eslintPluginPackageJson from "eslint-plugin-package-json";
import eslintPluginStylistic from "@stylistic/eslint-plugin";
import globals from "globals";
import {flatConfigs as importConfigs} from "eslint-plugin-import-x";

const config = [
  eslintPluginJs.configs.all,
  eslintPluginPackageJson.configs.recommended,
  importConfigs.recommended,
  ...eslintPluginMarkdown.configs.recommended,
  {
    "files": ["CHANGELOG.md"],
    "rules": {
      "markdown/heading-increment": "off"
    }
  },
  {
    "files": ["**/*.md"],
    "language": "markdown/gfm",
    "plugins": {
      eslintPluginMarkdown
    },
    "rules": {
      "logical-assignment-operators": "off",
      "markdown/no-missing-label-refs": "off",
      "max-lines-per-function": "off",
      "no-irregular-whitespace": "off"
    }
  },
  {
    "files": ["package.json"],
    "rules": {
      "package-json/valid-package-def": "off"
    }
  },
  {
    "files": ["**/*.json"],
    "ignores": ["package.json", "package-lock.json"],
    "language": "json/json",
    ...eslintPluginJson.configs.recommended,
    "rules": {
      "logical-assignment-operators": "off",
      "max-lines-per-function": "off",
      "no-irregular-whitespace": "off"
    }
  },
  {
    "files": ["release.config.js"],
    "rules": {
      "no-template-curly-in-string": "off"
    }
  },
  {
    "files": ["**/*.js"],
    "languageOptions": {
      "ecmaVersion": "latest",
      "globals": {
        ...globals.browser,
        ...globals.node
      },
      "sourceType": "commonjs"
    },
    "plugins": {
      ...eslintPluginStylistic.configs.all.plugins
    },
    "rules": {
      ...eslintPluginStylistic.configs.all.rules,
      "@stylistic/array-element-newline": ["error", "consistent"],
      "@stylistic/dot-location": ["error", "property"],
      "@stylistic/function-call-argument-newline": ["error", "consistent"],
      "@stylistic/indent": ["error", 2],
      "@stylistic/lines-around-comment": "off",
      "@stylistic/multiline-comment-style": "off",
      "@stylistic/no-multi-spaces": ["error", {"ignoreEOLComments": true}],
      "@stylistic/object-property-newline": "off",
      "@stylistic/padded-blocks": ["error", "never"],
      "@stylistic/quote-props": ["error", "as-needed"],
      "capitalized-comments": "off",
      "consistent-this": "off",
      "default-case": "off",
      "func-style": "off",
      "init-declarations": "off",
      "line-comment-position": "off",
      "max-lines": "off",
      "max-lines-per-function": ["off"],
      "max-params": "off",
      "max-statements": ["error", 40],
      "multiline-comment-style": "off",
      "no-await-in-loop": "off",
      "no-inline-comments": "off",
      "no-magic-numbers": "off",
      "no-ternary": "off",
      "no-undef": "warn",
      "one-var": "off",
      "prefer-destructuring": "off",
      "sort-keys": "off",
      "strict": "off"
    }
  },
  {
    "files": ["**/*.mjs"],
    "languageOptions": {
      "ecmaVersion": "latest",
      "globals": {
        ...globals.node
      },
      "sourceType": "module"
    },
    "plugins": {
      ...eslintPluginStylistic.configs.all.plugins
    },
    "rules": {
      ...eslintPluginStylistic.configs.all.rules,
      "@stylistic/array-element-newline": ["error", "consistent"],
      "@stylistic/indent": ["error", 2],
      "@stylistic/padded-blocks": ["error", "never"],
      "func-style": "off",
      "import-x/no-unresolved": "off",
      "init-declarations": "off",
      "max-lines-per-function": ["error", 100],
      "max-statements": ["error", 25],
      "no-magic-numbers": "off",
      "no-ternary": "off",
      "one-var": "off",
      "prefer-destructuring": "off"
    }
  }
];

export default config;
