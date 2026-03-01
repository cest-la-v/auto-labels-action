# AGENTS.md

## Project Overview

`multi-labeler` is a GitHub Action (Node 20) that automatically labels pull requests and issues based on configurable matchers, and optionally generates commit status checks. It is distributed as a single bundled file (`dist/index.js`) built with `@vercel/ncc`.

## Architecture

```
src/main.ts         — Entry point: reads inputs, orchestrates labeling + check creation
src/config.ts       — Parses and validates .github/labeler.yml using io-ts (runtime type-checking)
src/labeler.ts      — Runs all 8 matchers in parallel, merges results with current PR/issue labels
src/checks.ts       — Evaluates check conditions against matched labels, produces StatusCheck objects
src/matcher/        — One file per matcher type (title, body, comment, branch, base-branch, commits, files, author)
```

**Data flow:** `main.ts` → `getConfig()` → `labels()` (runs all matchers in parallel) → `mergeLabels()` → add/remove via GitHub API → `checks()` → `createCommitStatus` per check.

## Key Patterns

### Adding a new matcher
Each matcher in `src/matcher/` exports a default function with the signature:
```ts
export default function match(client: InstanceType<typeof GitHub>, config: Config): string[] | Promise<string[]>
```
It filters `config.labels` for entries where its matcher field is defined, tests the condition, and returns matching label names. After creating the matcher file, import and call it inside `labeler.ts`'s `labels()` function alongside the other eight.

### Config validation (io-ts)
`src/config.ts` defines the schema with `io-ts` codecs. Extend `Matcher` (a `t.partial`) to add new matcher fields — the type is both the runtime validator and the TypeScript type via `t.TypeOf<typeof Matcher>`. Validation errors are surfaced via `io-ts-reporters` with a descriptive message.

### `sync: true` labels
Labels with `sync: true` are removed from the PR/issue when their matcher no longer matches. Removal is skipped for `issue_comment` and `push` events — only `pull_request`, `pull_request_target`, and `issue` events trigger removal.

### Checks
`checks.ts` maps each `Check` config entry to a `StatusCheck` by evaluating `any`/`all`/`none` label conditions. Checks are only created for `pull_request` events (not issues).

## Developer Workflows

```bash
npm test              # Run all Jest tests (ts-jest, no compile step needed)
npm run build         # tsc → lib/ (validates types but not the action entrypoint)
npm run package       # ncc build → dist/index.js  ← must run before committing action changes
npm run lint          # eslint --fix
npm run format        # prettier --write
```

**`dist/index.js` must be committed** — `action.yml` points to it as `main`. Always run `npm run package` after source changes.

## Testing Conventions

- Matcher unit tests (`__tests__/matcher/*.test.ts`) set `github.context.payload` directly and call the matcher with `null` as the client (synchronous matchers ignore it).
- Integration tests (`__tests__/labeler.test.ts`, `__tests__/config.test.ts`) use a mock GitHub client that reads fixture files from `__tests__/fixtures/` as if they were fetched from the API.
- Invalid config scenarios live in `__tests__/fixtures/invalid/` and are tested to throw.
- `@ts-ignore` is expected in test mock clients — do not remove them.

## External Dependencies to Know

| Package | Purpose |
|---|---|
| `@actions/core` / `@actions/github` | GitHub Actions SDK; context, inputs, Octokit |
| `io-ts` + `fp-ts` | Runtime config schema validation |
| `io-ts-reporters` | Human-readable io-ts decode error messages |
| `minimatch` | Glob matching for the `files` matcher |
| `lodash` | `uniq`, `concat`, `difference` for label set operations |

## Communication with the End User

Always present the end user with a summary of changes made or planned, including any breaking changes or side effects.

## Continuity

Each session, you wake up fresh. This file (`AGENTS.md`) _is_ your memory. Read it. Update it. It's how you persist.

If you change this file, tell the user — it's your memory, and they should know.

---

_This file is yours to evolve. As you learn what's important and essential to know about working on this repository, update it._
