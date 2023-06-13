module.exports = {
    branches: [
        "master"
    ],
    debug: true,
    plugins: [
        [
            "@semantic-release/commit-analyzer",
            {
                preset: 'conventionalCommits',
                releaseRules: [
                    { type: "docs", release: "patch" },
                    { type: "perf", release: "patch" },
                    { type: "docs", breaking: true, release: "major" },
                    { type: "perf", breaking: true, release: "major" },
                ],
            },
        ],
        [
            "@semantic-release/release-notes-generator",
            {
                preset: 'conventionalCommits',
                presetConfig: {
                    types: [
                        { type: "feat", section: "Features", hidden: false },
                        { type: "fix", section: "Bug Fixes", hidden: false },
                        { type: "perf", section: "Performance", hidden: false },
                        { type: "docs", section: "Documentation", hidden: false },
                    ],
                },
            },
        ],
        [
            "@semantic-release/changelog", 
            {
                changelogTitle: "Teamcity Unity CCD Uploader Changelog",
            }
        ],
        "@semantic-release/npm",
        "@semantic-release/github",
        "@semantic-release/git",
    ],
}