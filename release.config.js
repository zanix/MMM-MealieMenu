module.exports = {
  branches: [
    "main",
    {
      name: "develop",
      prerelease: "beta"
    }
  ],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    [
      "@semantic-release/npm", {
        npmPublish: false
      }
    ],
    [
      "@semantic-release/github", {
        failComment: false
      }
    ],
    [
      "@semantic-release/git", {
        assets: ["package.json", "package-lock.json", "CHANGELOG.md"],
        message: "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
      }
    ]
  ]
};
