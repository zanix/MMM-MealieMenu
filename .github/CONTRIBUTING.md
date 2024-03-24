# Contribution Policy for MMM-MealieMenu

Thanks for contributing to MMM-MealieMenu!

We hold our code to a a set of standards, and these standards are documented below.

## Install Development Packages

Run `npm install` since the normal installation instructions do not install the development packages.

## Linters

Several linters are used for automatic linting of files.

- [ESLint](https://eslint.org) for JavaScript files. Configuration is in `.stylelintrc`.
- [StyleLint](https://stylelint.io) for CSS. Configuration is in `.stylelintrc.json`.
- [Prettier](https://prettier.io) for the rest of the files. Configuration is in `prettier.config.js` and `.prettierignore`.

To run automatic linting, use `npm run lint:fix`.

## Testing

There are currently no tests.

## Submitting Issues

Please refer to the [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md) or [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md) Issue templates before [submitting an issue](issues).
