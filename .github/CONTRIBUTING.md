# Contribution Policy for MMM-MealieMenu

Thanks for contributing to MMM-MealieMenu!

We hold our code to a a set of standards, and these standards are documented below.

## Install Development Packages

Run `npm install` since the normal installation instructions do not install the development packages.

## Developer Commands

- `npm install` - Install all dependencies including development dependencies
- `npm run lint` - Run linting and formatter checks
- `npm run lint:fix` - Fix linting and formatter issues
- `npm run release` - Create a new release (Bumps version, creates changelog, commits, tags)
- `npm run test` - Run linting and formatter checks

## Linters

[Prettier](https://prettier.io) used for automatic linting of files which has ESLint bundled for CSS, JS, and Markdown files.

Configuration for Prettier is in `prettier.config.mjs` and `.prettierignore`. ESlint configuration is in `eslint.config.mjs`.

To run automatic linting, use `npm run lint:fix`.

## Testing

There are currently no tests.

## Submitting Issues

Please refer to the [Bug Report](/.github/ISSUE_TEMPLATE/bug_report.md) or [Feature Request](/.github/ISSUE_TEMPLATE/feature_request.md) Issue templates before [submitting an issue](issues).
