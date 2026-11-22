# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [2.0.0](https://github.com/zanix/MMM-MealieMenu/compare/v1.7.0...v2.0.0) (2026-11-22)

### Added

* add "mealie" template, CSS variables, and rework default template ([4532c2b](https://github.com/zanix/MMM-MealieMenu/commit/4532c2b3b24098ec303d50dc74476e4ef1ae860d)), closes [#7](https://github.com/zanix/MMM-MealieMenu/issues/7)
* add configuration schema and test ([d600b46](https://github.com/zanix/MMM-MealieMenu/commit/d600b46539d6a1fa125411d17ebdb0bcb08dde33))
* add fontSize option and validation ([0044d63](https://github.com/zanix/MMM-MealieMenu/commit/0044d632a61a1d858060986fe1f6c1d14bfb18d8))
* add MealieClient and refactor node_helper to per-instance clients ([9c01422](https://github.com/zanix/MMM-MealieMenu/commit/9c01422ae3d1bb4cd6bee114a4d09b64f4b3cc05))
* add option to group meals by day ([853ac99](https://github.com/zanix/MMM-MealieMenu/commit/853ac9968fb950bbeaa2664976d45f4bec315079)), closes [#165](https://github.com/zanix/MMM-MealieMenu/issues/165)
* add showTodayLabel option to toggle "Today" header ([018278a](https://github.com/zanix/MMM-MealieMenu/commit/018278aafd9a3661259587ad7b6d041789bf4f67))
* **config:** add config validation module and refactor init/error flow ([4656a28](https://github.com/zanix/MMM-MealieMenu/commit/4656a28b70720f5dc7844ee2e285c9dec555144f))
* **images:** support recipe image version and caching ([747a92c](https://github.com/zanix/MMM-MealieMenu/commit/747a92c82de1aa19ab559e9916c2de59defb4730))
* proxy recipe images ([fc87125](https://github.com/zanix/MMM-MealieMenu/commit/fc871256edc7ce54d5350fbab2ac34d2eeb97447))

### Fixed

* **client:** don't send credentials for recipe images ([70cdc41](https://github.com/zanix/MMM-MealieMenu/commit/70cdc41840f2c91efe5b19afa61eb89be429a408))
* **config:** remove 256-character limit from TOKEN regex ([d880169](https://github.com/zanix/MMM-MealieMenu/commit/d880169f025b833898addced454a8252a8c45271))
* correct week range calculation; update styles and docs ([f77c2eb](https://github.com/zanix/MMM-MealieMenu/commit/f77c2eb73562f9bc726c4e4532dc96ddd19654d6))
* load moment ([6b13eb9](https://github.com/zanix/MMM-MealieMenu/commit/6b13eb9a64148dd4676d796c5baecec9df440833))
* remove moment-with-locales client script import ([969da62](https://github.com/zanix/MMM-MealieMenu/commit/969da626589c65b54c9081c6b63384b6f8c8d11b))
* show TODAY label for current day and fix collapse ([5e6d601](https://github.com/zanix/MMM-MealieMenu/commit/5e6d601031a4bad567ce05f79f452e0747ac6c5f))

### Documentation

* add AI disclosure to README ([cb87dd1](https://github.com/zanix/MMM-MealieMenu/commit/cb87dd1813beba82220f90db6e44fec69a6cfc6b))
* displayLastUpdate default is false ([21baaf6](https://github.com/zanix/MMM-MealieMenu/commit/21baaf65e20bafea78704137f09e07d8063f15cb))
* move screenshots, add screenshot ([86d06d5](https://github.com/zanix/MMM-MealieMenu/commit/86d06d51f418e28eb89cfe1759f224c52950f4e4))
* **security:** update supported versions in SECURITY.md ([c875bd4](https://github.com/zanix/MMM-MealieMenu/commit/c875bd4853dde5543228879dad07482b37e7a493))
* update contributing, PR template, and normalize changelog ([45c0495](https://github.com/zanix/MMM-MealieMenu/commit/45c049532dbff083fbdafbf2738e75d0431dad1d))
* update for commit-and-tag-release ([58f3955](https://github.com/zanix/MMM-MealieMenu/commit/58f39552e07d20720ed848c9bf8f8b3c767d9f9f))
* update for commit-and-tag-release ([5b40bbd](https://github.com/zanix/MMM-MealieMenu/commit/5b40bbd8833bc0221f0cadb78ca35423dfa99b36))
* update templates, README, SECURITY, add Code of Conduct ([6edbe64](https://github.com/zanix/MMM-MealieMenu/commit/6edbe649daebc5763d05c855de08a779cf25fb0e))

### Chores

* change package.json, fix client log, update README ([36ae79c](https://github.com/zanix/MMM-MealieMenu/commit/36ae79cce4e15488878f363698c1e3e633c0d856))
* **deps-dev:** bump @commitlint/config-conventional ([479046f](https://github.com/zanix/MMM-MealieMenu/commit/479046fd5890dffe8298f134f84581a2b8128aa9))
* **deps-dev:** bump @eslint/js from 9.17.0 to 9.20.0 ([2ff5c1a](https://github.com/zanix/MMM-MealieMenu/commit/2ff5c1a8eae9b3cd95d076780e3740c6c2a33ea8))
* **deps-dev:** bump @eslint/json from 0.11.0 to 0.12.0 ([9729d7d](https://github.com/zanix/MMM-MealieMenu/commit/9729d7ddf183f492b4ed28a64dcaf26062c25770))
* **deps-dev:** bump @eslint/json from 0.12.0 to 0.13.2 ([7e34be9](https://github.com/zanix/MMM-MealieMenu/commit/7e34be92aaedbb207d8f17f4f1676284aac78d84))
* **deps-dev:** bump @eslint/json from 0.9.0 to 0.11.0 ([c94a655](https://github.com/zanix/MMM-MealieMenu/commit/c94a6550b3318b34fad09892214461e267c47fed))
* **deps-dev:** bump @eslint/markdown from 6.2.1 to 6.3.0 ([204c3ac](https://github.com/zanix/MMM-MealieMenu/commit/204c3ac0b9154894e25dec479077624ad38e8688))
* **deps-dev:** bump @eslint/markdown from 6.3.0 to 6.6.0 ([6673d42](https://github.com/zanix/MMM-MealieMenu/commit/6673d42acd34a1bb3b734b2e81d267392f8bf152))
* **deps-dev:** bump @eslint/markdown from 6.6.0 to 7.2.0 ([c36c7e2](https://github.com/zanix/MMM-MealieMenu/commit/c36c7e2c04c2acbb636a1237a7d55462d5dfbcab))
* **deps-dev:** bump @stylistic/eslint-plugin from 4.2.0 to 5.3.1 ([e954b9d](https://github.com/zanix/MMM-MealieMenu/commit/e954b9dfbf22da1f13e32e3732de4d06beae6f73))
* **deps-dev:** bump eslint from 9.17.0 to 9.20.0 ([087520e](https://github.com/zanix/MMM-MealieMenu/commit/087520efc4163e4b26ef49717fff3b1d4852c5db))
* **deps-dev:** bump eslint-plugin-import-x from 4.10.3 to 4.16.1 ([2cf37df](https://github.com/zanix/MMM-MealieMenu/commit/2cf37dffe63da969469b205ffedfce2b740e4ffa))
* **deps-dev:** bump eslint-plugin-package-json from 0.19.0 to 0.29.0 ([fc4aef2](https://github.com/zanix/MMM-MealieMenu/commit/fc4aef20a5a64895a964e4f58882626f36373f81))
* **deps-dev:** bump globals from 16.0.0 to 16.3.0 ([306b2ad](https://github.com/zanix/MMM-MealieMenu/commit/306b2ad1e9ee2a4683c94333ac374f49bdf53662))
* **deps-dev:** bump lint-staged from 15.3.0 to 15.5.0 ([a05765b](https://github.com/zanix/MMM-MealieMenu/commit/a05765bd91bf1ffd36a70ee2a53dd53c55533ba5))
* **deps-dev:** bump lint-staged from 15.5.1 to 16.2.3 ([e7c3f47](https://github.com/zanix/MMM-MealieMenu/commit/e7c3f47e379b0f9d325fb44f6501451994937513))
* **deps-dev:** bump prettier from 3.5.3 to 3.6.2 ([9acc049](https://github.com/zanix/MMM-MealieMenu/commit/9acc0497b835bfc19527087a23957a8639ae2a7f))
* **deps-dev:** bump semantic-release from 24.1.0 to 24.2.6 ([0b4439f](https://github.com/zanix/MMM-MealieMenu/commit/0b4439f97ca7dd1fd59893fcaaca4e6fe1e94003))
* **deps-dev:** bump semantic-release from 24.2.6 to 24.2.7 ([fddf738](https://github.com/zanix/MMM-MealieMenu/commit/fddf73840411811c6bcd19522de43e89290f01e3))
* **deps-dev:** bump stylelint from 16.12.0 to 16.14.1 ([50226f4](https://github.com/zanix/MMM-MealieMenu/commit/50226f4521d922589473d7e865f3741e57b06ff1))
* **deps-dev:** bump stylelint from 16.18.0 to 16.21.0 ([d05b787](https://github.com/zanix/MMM-MealieMenu/commit/d05b787620e7d5062a2c7a94432e491a9cca14ea))
* **deps-dev:** bump stylelint from 16.23.0 to 16.24.0 ([e5615e0](https://github.com/zanix/MMM-MealieMenu/commit/e5615e09b5ef48f03e2383ae19c3ad26ff345a0d))
* **deps-dev:** bump stylelint-config-standard from 38.0.0 to 39.0.0 ([fd0aba7](https://github.com/zanix/MMM-MealieMenu/commit/fd0aba7e5f24312909a3052dc15910550c6a8c71))
* **deps-dev:** update dev dependencies ([a8b6138](https://github.com/zanix/MMM-MealieMenu/commit/a8b61386ec16415bc264f79ba53b507b690de7f1))
* **deps:** add moment explicitly ([c491d65](https://github.com/zanix/MMM-MealieMenu/commit/c491d65f48bceed97a8e07a52fc367047aa66bbc))
* **deps:** bump actions/checkout from 4 to 5 ([6e526de](https://github.com/zanix/MMM-MealieMenu/commit/6e526de292375a0dc8d1e5a9d4c666f74e790cad))
* **deps:** bump actions/setup-node from 4 to 6 ([f1cab95](https://github.com/zanix/MMM-MealieMenu/commit/f1cab959470fdb6300cae8383de538ea1c05fcc0))
* **deps:** bump devDependencies eslint, eslint-plugin-package-json, globals ([2b5929c](https://github.com/zanix/MMM-MealieMenu/commit/2b5929c9a922047c98bb96211475a8cfae3fc9a5))
* **deps:** fix keywords and bump dependencies ([dbe17f4](https://github.com/zanix/MMM-MealieMenu/commit/dbe17f41c9ba517d2d6649e72e1d34128d2c9028))
* **deps:** replace dev dependencies ([eb714ed](https://github.com/zanix/MMM-MealieMenu/commit/eb714edc32b0281a10e35bc36e76b05198577474))
* **deps:** update linting dependencies and rules ([1091c81](https://github.com/zanix/MMM-MealieMenu/commit/1091c819bb96482be4db8ea3aa61e76be6420351))
* **deps:** upgrade devDependencies ([7a3d587](https://github.com/zanix/MMM-MealieMenu/commit/7a3d587a986199fad7d5f9aa04c48b257b3cc893))
* fix eslint config ([72c1e39](https://github.com/zanix/MMM-MealieMenu/commit/72c1e3901f7bd2b038e936673a561d218d8b9ef2))
* fix lint script ([aad9c68](https://github.com/zanix/MMM-MealieMenu/commit/aad9c6824c415b8df5bd7995874bb004d274e726))
* **lint:** add ESLint ignores and tidy code ([6604260](https://github.com/zanix/MMM-MealieMenu/commit/660426070294a1ebf93fda924c9a5e43fd33de2e))
* move governance files into .github directory ([de2198b](https://github.com/zanix/MMM-MealieMenu/commit/de2198b6f0e7983f566a8634d8e6216e542fb546))
* remove .versionrc.json and client version ([609c2a7](https://github.com/zanix/MMM-MealieMenu/commit/609c2a7ede9b6b0e79251f983a359a9543699f22))
* update dev dependencies ([a326490](https://github.com/zanix/MMM-MealieMenu/commit/a326490c0355b6f1638e8e8196c99aabfd16f243))
* update MagicMirror and Node.js version requirements ([ef560e2](https://github.com/zanix/MMM-MealieMenu/commit/ef560e2a0b18aeb633a2902af4a13c75c60dbc5a))

### Refactoring

* add config validation ([d423552](https://github.com/zanix/MMM-MealieMenu/commit/d423552d0de4dbdea8b6bd0073c953506e300496))
* **ui:** improve template and CSS for grouped meals ([a8b83bb](https://github.com/zanix/MMM-MealieMenu/commit/a8b83bbf4fef74245bcef0474644ebd04378bf99))

### Tests

* add tests and helpers ([b1098c4](https://github.com/zanix/MMM-MealieMenu/commit/b1098c495abc145bae8a78371fa7a5fe617bd184))

### Continuous Integration

* **workflows:** update automated-tests and release GitHub Actions ([422132a](https://github.com/zanix/MMM-MealieMenu/commit/422132ab83f52bc542c0b96d74fb26583b5f86ef))

## [1.7.0](https://github.com/zanix/MMM-MealieMenu/compare/v1.6.1...v1.7.0) (2024-10-23)

### Added

* add support for mealie v2 (households) ([fed93f7](https://github.com/zanix/MMM-MealieMenu/commit/fed93f78e079fa94c97b7317ab97d828db2f386e)), closes [#69](https://github.com/zanix/MMM-MealieMenu/issues/69)

### Fixed

* error log output ([0a64fa2](https://github.com/zanix/MMM-MealieMenu/commit/0a64fa200d90610e5765f6435956b678d8f169df))

### Chores

* **deps-dev:** bump @commitlint/config-conventional ([1ca23e9](https://github.com/zanix/MMM-MealieMenu/commit/1ca23e9c4c75037d7fd7e68148959887e3d7a116))
* **deps-dev:** bump lint-staged from 15.2.9 to 15.2.10 ([834b99e](https://github.com/zanix/MMM-MealieMenu/commit/834b99ea2ba98dde013651a751ec06ada7226de2))
* **deps-dev:** bump stylelint-prettier from 5.0.0 to 5.0.2 ([ffadb5d](https://github.com/zanix/MMM-MealieMenu/commit/ffadb5da0a99aec91ff246066db1b742edd6cb22))

## [1.6.1](https://github.com/zanix/MMM-MealieMenu/compare/v1.6.0...v1.6.1) (2024-09-03)

### Fixed

* mealSortOrder actually filters entry types ([62a247b](https://github.com/zanix/MMM-MealieMenu/commit/62a247ba34ba2bb721fcc5c714853ad81d06aa56)), closes [#66](https://github.com/zanix/MMM-MealieMenu/issues/66)

### Chores

* **deps-dev:** bump @stylistic/eslint-plugin from 2.1.0 to 2.7.2 ([4b7c31a](https://github.com/zanix/MMM-MealieMenu/commit/4b7c31a55c1c1914360e9f5c158705c7308913b4))
* **deps-dev:** bump globals from 15.0.0 to 15.9.0 ([0b444da](https://github.com/zanix/MMM-MealieMenu/commit/0b444dabbc7a30c2e55c13c762db42a8b8ab1fc4))
* **deps-dev:** bump lint-staged from 15.2.5 to 15.2.9 ([3428f2a](https://github.com/zanix/MMM-MealieMenu/commit/3428f2aaf05a59c80dddfb0e0841cc72498a4acf))
* **deps-dev:** bump prettier from 3.2.5 to 3.3.3 ([4947b01](https://github.com/zanix/MMM-MealieMenu/commit/4947b01c03b50e93a6c5849e7b9ea253b9eef255))
* **deps-dev:** bump semantic-release from 23.0.8 to 24.1.0 ([c57fd1e](https://github.com/zanix/MMM-MealieMenu/commit/c57fd1e0d1e61560a37def6ab451800f9c6bdb16))
* **deps-dev:** bump stylelint from 16.6.1 to 16.9.0 ([6d80b84](https://github.com/zanix/MMM-MealieMenu/commit/6d80b84a6ab46b46c49a1bd7432bc1a141435221))

## [1.6.0](https://github.com/zanix/MMM-MealieMenu/compare/v1.5.0...v1.6.0) (2024-06-12)

### Added

* add token refresh when it expires ([49762ec](https://github.com/zanix/MMM-MealieMenu/commit/49762ec058789a05afe83d0dd4a18c0efcf582e8))

### Fixed

* show last update when enabled ([2832336](https://github.com/zanix/MMM-MealieMenu/commit/2832336ff9d131ec190924be8e2ca719d1099534))

### Documentation

* fix currentWeek and priorDayLimit info ([71a977e](https://github.com/zanix/MMM-MealieMenu/commit/71a977ebdd6ee7d879174296611426379b2e165a))

### Chores

* **deps-dev:** bump @stylistic/eslint-plugin from 1.7.0 to 2.1.0 ([2176129](https://github.com/zanix/MMM-MealieMenu/commit/2176129ae3696e590b0382111695925815b0541f))
* **deps-dev:** bump lint-staged from 15.2.2 to 15.2.5 ([cd0b36b](https://github.com/zanix/MMM-MealieMenu/commit/cd0b36be035eaa2524a5b21421927697c4d65d59))
* **deps-dev:** bump stylelint from 16.5.0 to 16.6.1 ([e5f73d0](https://github.com/zanix/MMM-MealieMenu/commit/e5f73d0416af0353c6627c40eb14b406d279d652))

## [1.5.0](https://github.com/zanix/MMM-MealieMenu/compare/v1.4.0...v1.5.0) (2024-05-27)

### Added

* add currentWeek, dayLimit, and entryLimit ([c84291b](https://github.com/zanix/MMM-MealieMenu/commit/c84291b55ead550908b9711d6a715f6198c1a564))

### Fixed

* add more logging ([b7b7a12](https://github.com/zanix/MMM-MealieMenu/commit/b7b7a1290aa2b794e56d96690770327e14ce8a82))
* change updateInterval default to 1 hour ([69179d9](https://github.com/zanix/MMM-MealieMenu/commit/69179d979e7dd6fe1081469a14b253c68f3c418f))
* reset outstandingRequest on fetch error ([b1ce996](https://github.com/zanix/MMM-MealieMenu/commit/b1ce99649adb7f95584468f61b620e9410f81263))

### Documentation

* add btoconnor to contributors ([99fd0e1](https://github.com/zanix/MMM-MealieMenu/commit/99fd0e168cb0cabadae30999c48484906253c16e))
* update readme and comments ([c5e1b8a](https://github.com/zanix/MMM-MealieMenu/commit/c5e1b8a7d19ef064f30fcdf07c692d833cac46a9))

### Chores

* **deps-dev:** bump @commitlint/cli from 19.2.1 to 19.3.0 ([6a8c241](https://github.com/zanix/MMM-MealieMenu/commit/6a8c24164ce1bfb8079a271b53492af313f3140b))
* **deps-dev:** bump @commitlint/config-conventional ([54e4b5c](https://github.com/zanix/MMM-MealieMenu/commit/54e4b5ceba82d591ad5de2e85581580cf12926bd))
* **deps-dev:** bump markdownlint-cli from 0.39.0 to 0.41.0 ([a26d702](https://github.com/zanix/MMM-MealieMenu/commit/a26d702979ab3b7a9539a298c1c14674d9e3660b))
* **deps-dev:** bump semantic-release from 23.0.6 to 23.0.8 ([720f177](https://github.com/zanix/MMM-MealieMenu/commit/720f1779afc9fcd14d2179ffa9880bb140c1db81))
* **deps-dev:** bump stylelint from 16.3.1 to 16.5.0 ([5876f1c](https://github.com/zanix/MMM-MealieMenu/commit/5876f1c4523387a02320653284917ee89f7245cb))
* update gitignore ([6129fe9](https://github.com/zanix/MMM-MealieMenu/commit/6129fe9dc9f003785a0b4f5420ea0ef0c28a0bee))

## [1.4.0](https://github.com/zanix/MMM-MealieMenu/compare/v1.3.0...v1.4.0) (2024-04-01)

### Added

* add message when meal plan is empty ([11d0427](https://github.com/zanix/MMM-MealieMenu/commit/11d042792632b67bade12c25f1f2c8f66b7f7ddb))

### Documentation

* add pr template, add contributing guide, update readme ([b1b6ed3](https://github.com/zanix/MMM-MealieMenu/commit/b1b6ed316212bc4f68b530bb827d5bfb244f99cd))
* fix links in docs ([a15e13f](https://github.com/zanix/MMM-MealieMenu/commit/a15e13f66aa2b33183d9c052f678e06c03715815))

### Chores

* **deps-dev:** bump @commitlint/config-conventional ([908e176](https://github.com/zanix/MMM-MealieMenu/commit/908e176e74095dd1509451b16c69ee927ced3d4c))
* **deps-dev:** bump @stylistic/eslint-plugin from 1.6.3 to 1.7.0 ([cae37ee](https://github.com/zanix/MMM-MealieMenu/commit/cae37eec96b65f1b29ac49a880ae50535fc525ea))
* **deps-dev:** bump globals from 14.0.0 to 15.0.0 ([c1f4d63](https://github.com/zanix/MMM-MealieMenu/commit/c1f4d633d8236a1040be12f88914465ab05bdda3))
* **deps-dev:** bump semantic-release from 22.0.12 to 23.0.5 ([cd7d948](https://github.com/zanix/MMM-MealieMenu/commit/cd7d948caf7d9845a08e28a51b12ab058b3660f1))
* **deps-dev:** bump semantic-release from 23.0.5 to 23.0.6 ([977353b](https://github.com/zanix/MMM-MealieMenu/commit/977353b1e975213a6184cc8f7b9c4ac4ef2aeaff))
* **deps-dev:** bump stylelint from 16.3.0 to 16.3.1 ([16358e7](https://github.com/zanix/MMM-MealieMenu/commit/16358e7bffd5fd4a4ac569aa76284d6b0cd01a08))
* remove moment, bump @commitlint/cli from 19.0.3 to 19.2.1 ([03591dc](https://github.com/zanix/MMM-MealieMenu/commit/03591dc5090c8f5cbdb84f4e5ce09516a9ffb1b1))
* update issue templates ([bbec9aa](https://github.com/zanix/MMM-MealieMenu/commit/bbec9aab34926236c06a7fe59dac6955bad06160))

### Continuous Integration

* fix linting issues ([2a829c5](https://github.com/zanix/MMM-MealieMenu/commit/2a829c557c379d287c0c47bf7f673027f9791c81))
* ignore changelog.md in prettier ([1408c10](https://github.com/zanix/MMM-MealieMenu/commit/1408c101a0a88fb4b21c964b5f965a01749e9d7b))

## [1.3.0](https://github.com/zanix/MMM-MealieMenu/compare/v1.2.0...v1.3.0) (2024-03-12)

### Added

* Enclose meal header components in span elements ([8fa50a6](https://github.com/zanix/MMM-MealieMenu/commit/8fa50a66979adb9300e7b9373dbf298b85639adb))

### Documentation

* update readme ([fb5cde3](https://github.com/zanix/MMM-MealieMenu/commit/fb5cde34d188a2c13153da1b8269e1968a7611eb))

### Continuous Integration

* downgrade semantic-release, fix husky ([2f62ca6](https://github.com/zanix/MMM-MealieMenu/commit/2f62ca6f8665c5719081acea295cb7fbe29be6f6))
* update releaserc, package-lock ([7973cac](https://github.com/zanix/MMM-MealieMenu/commit/7973cac3208d78cb1cf05d6ed07895df3c27a78c))

## [1.2.0](https://github.com/zanix/MMM-MealieMenu/compare/v1.1.1...v1.2.0) (2024-03-10)

### Added

* add default picture, add meal description, fix meal name wrap ([2b2983b](https://github.com/zanix/MMM-MealieMenu/commit/2b2983b38b653f6dd35de8990e9ddf4f4d5d0c76)), closes [#2](https://github.com/zanix/MMM-MealieMenu/issues/2)

### Continuous Integration

* add semantic-release, update actions ([2ebeffc](https://github.com/zanix/MMM-MealieMenu/commit/2ebeffc0a45f9d964e821068c40704d9b4e5c4b9))

## [1.1.1](https://github.com/zanix/MMM-MealieMenu/compare/v1.1.0...v1.1.1) (2024-03-10)

### Fixed

* meal plan notes ([fe7779f](https://github.com/zanix/MMM-MealieMenu/commit/fe7779f1f7ff2e3d6deebec502afde2b2c4d0892)), closes [#2](https://github.com/zanix/MMM-MealieMenu/issues/2)

## [1.1.0](https://github.com/zanix/MMM-MealieMenu/compare/v1.0.0...v1.1.0) (2024-03-08)

### Added

* Add GroupId, remove Axios, validate host, fix error font size ([dac235c](https://github.com/zanix/MMM-MealieMenu/commit/dac235c0d7ae6dd54d6f9dc456b06f2db55fd2f6))

## 1.0.0 (2024-03-07)

### Added

* Initial release
