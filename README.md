# Auto Labels

[![Release](https://img.shields.io/github/v/release/cest-la-v/auto-labels-action)](https://github.com/cest-la-v/auto-labels-action/releases)
[![License MIT](https://img.shields.io/github/license/cest-la-v/auto-labels-action)](https://github.com/cest-la-v/auto-labels-action/blob/main/LICENSE)

Auto Labels for title, body, comments, commit messages, branch, base branch, author or files.
Optionally, generate a status check based on the labels.

> **Based on [fuxingloh/multi-labeler](https://github.com/fuxingloh/multi-labeler)** — forked and refactored with additional changes.

## Features

- Single compiled javascript file, extremely fast. Use fewer credits!
- Append based labeler, using `.github/labels.yml` as config.
- Automatically fail if `labels.yml` is malformed, type-checked.
- `removeOnMismatch: true` for conditional labeling — label is removed when the condition no longer matches.
- `include` / `exclude` fields with optional `mode: ANY | ALL` for fine-grained control.
- Regex Matcher:
  - PR/Issue title
  - PR/Issue body
  - PR/Issue comments
  - PR commit messages
  - PR branch name
  - PR base (target) branch name
- File Matcher:
  - Files count
  - Files any glob match
  - Files all glob match
- Author Matcher
- Generate status checks:
  - Any label match
  - All label match
  - None label match

## Usage

#### `.github/workflows/labels.yml`

```yml
on:
  pull_request_target:
  # for OSS with public contributions (forked PR)

  pull_request:
  # Useful for triaging code review, and generate compliance status check.
  # Semantic release? Done.
  # Make a file change in a mono repo. Tag the mono repo getting changed to generate better release!

  issues:
  # Useful for triaging error!
  # '- [x] Is this a bug?' = 'bug' label!

  issue_comment:
  # To pickup comment body in pr or issue and generate a label.
  # Imagine someone comment 'Me too, I get TimeoutException from ...' in comment body.
  # Generate a 'bug/timeout' label for better triaging!

permissions:
  # Setting up permissions in the workflow to limit the scope of what it can do. Optional!
  contents: read # the config file
  issues: write # for labeling issues (on: issues)
  pull-requests: write # for labeling pull requests (on: pull_request_target or on: pull_request)
  statuses: write # to generate status
  checks: write # to generate status

jobs:
  labeler:
    name: Labeler
    runs-on: ubuntu-latest
    steps:
      # follows semantic versioning. Lock to different version: v1, v1.5, v1.5.0 or use a commit hash.
      - uses: cest-la-v/auto-labels-action@v1 # v1
        with:
          github-token: ${{secrets.GITHUB_TOKEN}} # optional, default to '${{ github.token }}'
          config-path: .github/labels.yml # optional, default to '.github/labels.yml'
          config-repo: my-org/my-repo # optional, default to '${{ github.repository }}'
```

#### `.github/labels.yml`

```yml
# .github/labels.yml

version: v1

labels:
  - label: 'feat'
    removeOnMismatch: true # remove label if include no longer matches, default: false (pull_request/issue only)
    include:
      mode: ANY # ANY: at least one field must match. ALL (default): all defined fields must match.
      title: '^feat:.*'
      body: '/feat'
      comment: '/feat'
      branch: '^feat/.*'
      baseBranch: '^feat/.*'
      commits: '^feat:.*'
      author:
        - github-actions
        - my-bot
      files:
        any: ['app/*']
        all: ['!app/config/**']
        count:
          gte: 1
          lte: 1000
    exclude:
      # exclude overrides include — if any exclude field matches, the label is NOT added
      author:
        - dependabot[bot]

# Optional, if you want labels to generate a success/failure status check
checks:
  - context: 'Status Check'
    url: 'https://go.to/detail'
    description:
      success: 'Ready for review & merge.'
      failure: 'Missing labels for release.'
    labels:
      any:
        - any
        - have
      all:
        - all
        - must
        - have
```

### Examples

<details>
  <summary>Semantic Pull Request</summary>

#### `.github/workflow/pr-triage.yml`

```yml
on:
  pull_request:
    types: [opened, edited, synchronize, ready_for_review]
    branches: [master, main]

jobs:
  labeler:
    name: Labeler
    runs-on: ubuntu-latest
    steps:
      - uses: cest-la-v/auto-labels-action@v1
```

#### `.github/labels.yml`

```yml
version: v1

labels:
  - label: 'feat'
    include:
      mode: ANY
      title: '^feat: .*'
      commits: '^feat: .*'

  - label: 'fix'
    include:
      mode: ANY
      title: '^fix: .*'
      commits: '^fix: .*'

  - label: 'chore'
    include:
      mode: ANY
      title: '^chore: .*'
      commits: '^chore: .*'

  - label: 'docs'
    include:
      mode: ANY
      title: '^docs: .*'
      commits: '^docs: .*'

checks:
  - context: 'Semantic Pull Request'
    url: 'https://github.com/cest-la-v/auto-labels-action/blob/main/.github/labels.yml'
    description:
      success: Ready for review & merge.
      failure: Missing semantic label for merge.
    labels:
      any:
        - feat
        - fix
        - chore
        - docs
```

</details>

<details>
  <summary>PR Triage</summary>

#### `.github/workflow/pr-triage.yml`

```yml
on:
  pull_request:
    types: [opened, edited, synchronize, ready_for_review]
    branches: [master, main]

jobs:
  labeler:
    name: Labeler
    runs-on: ubuntu-latest
    steps:
      - uses: cest-la-v/auto-labels-action@v1
```

#### `.github/labels.yml`

```yml
version: v1

labels:
  - label: 'feat'
    include:
      mode: ANY
      title: '^feat:.*'
      branch: '^feat/.*'
      commits: '^feat:.*'

  - label: 'fix'
    include:
      mode: ANY
      title: '^fix:.*'
      branch: '^fix/.*'
      commits: '^fix:.*'

  - label: 'release'
    include:
      baseBranch: '^release/.*'
```

</details>

<details>
  <summary>Issue Triage</summary>

#### `.github/workflow/issue-triage.yml`

```yml
on:
  issues:
    types: [opened, edited]

jobs:
  labeler:
    name: Labeler
    runs-on: ubuntu-latest
    steps:
      - uses: cest-la-v/auto-labels-action@v1
```

#### `.github/labels.yml`

```yml
version: v1

labels:
  - label: 'bug'
    include:
      body: "(\\n|.)*- \\[x\\] bug(\\n|.)*"
```

</details>

<details>
  <summary>Comment Triage</summary>

#### `.github/workflow/comment-slash.yml`

```yml
on:
  issue_comment:
    types: [created, edited]

jobs:
  labeler:
    name: Labeler
    runs-on: ubuntu-latest
    steps:
      - uses: cest-la-v/auto-labels-action@v1
```

#### `.github/labels.yml`

```yml
version: v1

labels:
  - label: 'coverage'
    include:
      comment: "# \\[Codecov\\] .*"

  - label: 'stale'
    include:
      comment: '/stale'
```

</details>

## Configuration

Once you've added cest-la-v/auto-labels-action to your repository,
it must be enabled by adding a `.github/labels.yml` configuration file to the repository.
If you want to use a configuration file shared across multiple repositories,
you can set the `config-repo` input to point to a different repository.
However, make sure to set a `github-token` that has permissions to access the provided repository,
as the default `GITHUB_TOKEN` only has access to the repository the action is running in.

> The full config schema (all fields with descriptions) is in [docs/labels.schema.json](docs/labels.schema.json).

## Labels

Each entry in `labels` defines when a label is added or removed.

```yml
labels:
  - label: 'my-label' # required — GitHub label name
    removeOnMismatch: true # optional (default: false) — remove when include no longer matches
    include: # when this matches, add the label (a label with no include is never added)
      mode: ANY # ANY = at least one field must match; ALL (default) = all fields must match
      title: '^feat:.*'
    exclude: # when this matches, skip adding the label (overrides include)
      author: 'dependabot[bot]'
```

### `include` / `exclude` matching

Both `include` and `exclude` accept the same set of matcher fields. `exclude` takes precedence — if any exclude field matches, the label is not added regardless of `include`.

`include.mode` controls how multiple `include` fields are combined:

- `ALL` (default) — every defined field must match
- `ANY` — at least one defined field must match

### `removeOnMismatch`

When `removeOnMismatch: true`, the label is removed from the PR/issue when the `include` condition no longer matches. Only active on `pull_request`, `pull_request_target`, and `issue` events (not `issue_comment` or `push`).

## Matchers

> RegEx values can be written as `/pattern/` (with slashes) or as a plain string. Backslashes must be double-escaped: `\\` instead of `\`. To match `()` use `\\(\\)`.

### PR/Issue Title: RegEx

```yml
labels:
  - label: 'feat'
    include:
      title: '^feat:.*'
```

### PR/Issue Body: RegEx

```yml
labels:
  - label: 'bug'
    include:
      # e.g. '- [x] bug'
      body: "(\\n|.)*- \\[x\\] bug(\\n|.)*"
```

### PR/Issue Comment: RegEx

```yml
labels:
  - label: 'stale'
    include:
      comment: '/stale'
```

### PR Branch: RegEx

```yml
labels:
  - label: 'feat'
    include:
      branch: '^feat/.*'
```

### PR Base Branch: RegEx

```yml
labels:
  - label: 'release'
    include:
      baseBranch: '^release/.*'
```

### PR Commits: RegEx

Check all commits and find any match, max of 250 commits only.

```yml
labels:
  - label: 'feat'
    include:
      commits: '^feat: .*'
```

### PR/Issue Author

```yml
labels:
  - label: 'single'
    include:
      author: 'some-user'
  - label: 'any'
    include:
      author:
        - adam
        - claire
```

### PR Files: [Glob Matcher](https://github.com/isaacs/minimatch)

Maximum of 3000 files only.
If you use this to audit changes, take note of the 3000 files limitation.

#### PR Files Basic

```yml
labels:
  - label: 'github'
    removeOnMismatch: true
    include:
      # shorthand for any: [".github/**"]
      files: '.github/**'

  - label: 'security'
    removeOnMismatch: true
    include:
      # shorthand for any: ["web/security/**", "security/**"]
      files: ['web/security/**', 'security/**']
```

#### PR Files Count

```yml
labels:
  - label: 'size: s'
    removeOnMismatch: true
    include:
      files:
        count:
          gte: 1
          lte: 4

  - label: 'size: m'
    removeOnMismatch: true
    include:
      files:
        count:
          gte: 5
          lte: 10

  - label: 'size: l'
    removeOnMismatch: true
    include:
      files:
        count:
          gte: 11
```

#### PR Files Any & All

```yml
labels:
  - label: 'ci'
    removeOnMismatch: true
    include:
      files:
        any: ['.github/workflow/**', '.circleci/**']
        all: ['!app/**']

  - label: 'attention'
    removeOnMismatch: true
    include:
      files:
        any: ['app/**']
        count:
          neq: 1
```

## PR Status Checks

### Check any

```yml
checks:
  - context: 'Release Drafter'
    url: 'https://go.to/detail'
    description:
      success: 'Ready for review & merge.'
      failure: 'Missing labels for release.'
    labels:
      any:
        - feat
        - fix
        - chore
        - docs
```

### Check any + all

```yml
checks:
  - context: 'Merge check'
    description: 'Labels for merge.'
    labels:
      any: ['reviewed', 'size:s']
      all: ['app']
```

### Check none

```yml
checks:
  - context: 'Merge check'
    description: "Disable merging when 'DO NOT MERGE' label is set"
    labels:
      none: ['DO NOT MERGE']
```

## Attribution

This project is a fork of [fuxingloh/multi-labeler](https://github.com/fuxingloh/multi-labeler), refactored and extended with additional changes.
Thanks to the original author for the solid foundation.
