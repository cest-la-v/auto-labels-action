# AGENTS.md

## Project Overview

`auto-labels-action` (Auto Labels) is a GitHub Action (Node 20) that automatically labels pull requests and issues based on configurable matchers, and optionally generates commit status checks. It is distributed as a single bundled file (`dist/index.js`) built with `@vercel/ncc`.

## Architecture

```
src/main.ts         — Entry point: reads inputs, orchestrates labeling + check creation
src/config.ts       — Parses and validates .github/labeler.yml using io-ts (runtime type-checking)
src/labels.ts       — Evaluates labels per-label (include/exclude/mode), merges with current PR/issue labels
src/checks.ts       — Evaluates check conditions against matched labels, produces StatusCheck objects
src/matcher/        — One file per matcher type (title, body, comment, branch, base-branch, commits, files, author)
```

**Data flow:** `main.ts` → `getConfig()` → `labels()` → `buildContext()` (gathers PR data once) → per-label `evaluateLabel()` → `mergeLabels()` → add/remove via GitHub API → `checks()` → `createCommitStatus` per check.

## Config Schema

Full JSON Schema with field-level descriptions: [docs/labels.schema.json](docs/labels.schema.json).

Key rules:
- A label with no `include` is **never** auto-added.
- `exclude` with no fields never excludes.
- `removeOnMismatch: true` on a label causes removal when the label no longer matches.
- `include.mode`: `ALL` (default) = every defined field must match; `ANY` = at least one must match.

## Key Patterns

### Adding a new matcher

Each matcher in `src/matcher/` exports a `test()` function with the signature:

```ts
export function test(fields: MatcherFields, value: <type>): boolean
```

It reads its field from `fields` (e.g. `fields.title`), returns `false` if undefined, and returns the match result. After creating the matcher file, call it inside `labels.ts`'s `collectResults()` function.

### Config validation (io-ts)

`src/config.ts` defines the schema with `io-ts` codecs. Extend `MatcherFields` (a `t.partial`) to add new matcher fields — the type is both the runtime validator and the TypeScript type via `t.TypeOf<typeof MatcherFields>`. `Include` extends `MatcherFields` with an optional `mode` field. Validation errors are surfaced via `io-ts-reporters` with a descriptive message.

### `removeOnMismatch: true` labels

Labels with `removeOnMismatch: true` are removed from the PR/issue when their matcher no longer matches. Removal is skipped for `issue_comment` and `push` events — only `pull_request`, `pull_request_target`, and `issue` events trigger removal.

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

- Matcher unit tests (`__tests__/matcher/*.test.ts`) call `test(fields, value)` directly with plain objects — no `github.context.payload` mocking needed.
- Integration tests (`__tests__/labels.test.ts`, `__tests__/config.test.ts`) use a mock GitHub client that reads fixture files from `__tests__/fixtures/` as if they were fetched from the API.
- Invalid config scenarios live in `__tests__/fixtures/invalid/` and are tested to throw.
- `@ts-ignore` is expected in test mock clients — do not remove them.

## External Dependencies to Know

| Package                             | Purpose                                                 |
| ----------------------------------- | ------------------------------------------------------- |
| `@actions/core` / `@actions/github` | GitHub Actions SDK; context, inputs, Octokit            |
| `io-ts` + `fp-ts`                   | Runtime config schema validation                        |
| `io-ts-reporters`                   | Human-readable io-ts decode error messages              |
| `minimatch`                         | Glob matching for the `files` matcher                   |
| `lodash`                            | `uniq`, `concat`, `difference` for label set operations |

## TypeScript Navigation — LSP Tools

The VS Code extension **LSP MCP Bridge** (`sehejjain.lsp-mcp-bridge`) is installed in this workspace. It exposes the TypeScript language server as Copilot tools. All agents are configured to **prefer these tools over grep/file-read** when navigating source code:

| Task                                    | Tool                    |
| --------------------------------------- | ----------------------- |
| Find definition of a type / function    | `lsp_definition`        |
| Find all usages / callers               | `lsp_references`        |
| Get type, generics, or JSDoc            | `lsp_hover`             |
| Locate a symbol by name across the repo | `lsp_workspace_symbols` |
| Get the full outline of a file          | `lsp_document_symbols`  |
| Understand function parameters          | `lsp_signature_help`    |
| Check quick-fixes after an edit         | `lsp_code_actions`      |

Use `search` (grep) only for YAML/fixture files or when no file URI is known yet. Use `read` only when you need exact line content to quote or edit.

## Custom Agents

Four agents live in `.github/agents/`. For non-trivial tasks, switch to the `orchestrator` agent — it sequences the others and enforces plan approval and commit gates. For simple single-file fixes, use the default agent directly.

| Agent          | File                    | Role                                                              | Model             |
| -------------- | ----------------------- | ----------------------------------------------------------------- | ----------------- |
| `orchestrator` | `orchestrator.agent.md` | Drives the full plan → implement → review → commit loop           | Claude Sonnet 4.6 |
| `planner`      | `planner.agent.md`      | Research codebase, produce hit list & plan — no code              | Claude Sonnet 4.6 |
| `implementer`  | `implementer.agent.md`  | TDD: write failing tests → minimal code → green → lint            | Claude Haiku 4.5  |
| `reviewer`     | `reviewer.agent.md`     | Read-only review gate; returns APPROVED / NEEDS_REVISION / FAILED | Claude Sonnet 4.6 |

**Scratchpad / task state**: the orchestrator writes progress to `plans/` (gitignored by default). Do not put ephemeral state in `AGENTS.md`.

## Communication with the End User

Always present the end user with a summary of changes made or planned, including any breaking changes or side effects.

## Continuity

Each session, you wake up fresh. This file _is_ your memory. Read it. Update it. It's how you persist.

If you change this file, tell the user — it's your memory, and they should know.

---

_This file is yours to evolve. As you learn more about how to work on this repository better and efficiently, update it._
