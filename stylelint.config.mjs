const config = {
  "extends": ["stylelint-config-standard", "stylelint-prettier/recommended"],
  "root": true,
  "rules": {
    "selector-class-pattern": "^(MMM-.*|[a-z][a-z0-9]*(-[a-z0-9]+)*)$"
  }
};

export default config;
