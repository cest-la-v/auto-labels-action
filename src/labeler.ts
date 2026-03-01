import { GitHub } from '@actions/github/lib/utils';
import { Config, Include, Label, MatcherFields } from './config';

import { uniq, concat, difference } from 'lodash';
import { test as testTitle } from './matcher/title';
import { test as testBody } from './matcher/body';
import { test as testComment } from './matcher/comment';
import { test as testBranch } from './matcher/branch';
import { test as testBaseBranch } from './matcher/base-branch';
import { test as testCommits } from './matcher/commits';
import { test as testFiles } from './matcher/files';
import { test as testAuthor } from './matcher/author';
import * as github from '@actions/github';

interface MatcherContext {
  title?: string;
  body?: string;
  author?: string;
  branch?: string;
  baseBranch?: string;
  comment?: string;
  files: string[];
  commits: string[];
}

/**
 * @param {string[]} labels that are newly derived
 * @param {Config} config of the labels
 */
export function mergeLabels(labels: string[], config: Config): string[] {
  const context = github.context;
  const payload = context.payload.pull_request || context.payload.issue;

  const currents = (payload?.labels?.map((label: any) => label.name as string) as string[]) || [];

  const removals = (config.labels || [])
    .filter((label) => {
      // Is sync, not matched and currently added as a label in payload
      return label.sync && !labels.includes(label.label) && currents.includes(label.label);
    })
    .map((value) => value.label);

  return difference(uniq(concat(labels, currents)), removals);
}

async function fetchFiles(client: InstanceType<typeof GitHub>, prNumber: number): Promise<string[]> {
  const responses = await client.paginate(
    client.rest.pulls.listFiles.endpoint.merge({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: prNumber,
    }),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return responses.map((c: any) => c.filename);
}

async function fetchCommits(client: InstanceType<typeof GitHub>, prNumber: number): Promise<string[]> {
  const responses = await client.paginate(
    client.rest.pulls.listCommits.endpoint.merge({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: prNumber,
    }),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return responses.map((c: any) => c.commit.message);
}

async function buildContext(client: InstanceType<typeof GitHub>, config: Config): Promise<MatcherContext> {
  const payload = github.context.payload;
  const pr = payload.pull_request;
  const issue = payload.issue;
  const prOrIssue = pr || issue;

  const title: string | undefined = prOrIssue?.title;
  const body: string | undefined = prOrIssue?.body;
  const author: string | undefined = prOrIssue?.user?.login;
  const branch: string | undefined = pr?.head?.ref;
  const baseBranch: string | undefined = pr?.base?.ref;
  const comment: string | undefined = payload.comment?.body;
  const prNumber: number | undefined = pr?.number;

  const labelsArr = config.labels ?? [];
  const needsFiles = labelsArr.some((l) => l.include?.files !== undefined || l.exclude?.files !== undefined);
  const needsCommits = labelsArr.some((l) => l.include?.commits !== undefined || l.exclude?.commits !== undefined);

  const [files, commits] = await Promise.all([
    needsFiles && prNumber ? fetchFiles(client, prNumber) : Promise.resolve([]),
    needsCommits && prNumber ? fetchCommits(client, prNumber) : Promise.resolve([]),
  ]);

  return { title, body, author, branch, baseBranch, comment, files, commits };
}

function collectResults(fields: MatcherFields, ctx: MatcherContext): boolean[] {
  const results: boolean[] = [];

  if (fields.title !== undefined) results.push(testTitle(fields, ctx.title));
  if (fields.body !== undefined) results.push(testBody(fields, ctx.body));
  if (fields.comment !== undefined) results.push(testComment(fields, ctx.comment));
  if (fields.branch !== undefined) results.push(testBranch(fields, ctx.branch));
  if (fields.baseBranch !== undefined) results.push(testBaseBranch(fields, ctx.baseBranch));
  if (fields.author !== undefined) results.push(testAuthor(fields, ctx.author));
  if (fields.commits !== undefined) results.push(testCommits(fields, ctx.commits));
  if (fields.files !== undefined) results.push(testFiles(fields, ctx.files));

  return results;
}

function evaluateInclude(fields: Include | undefined, ctx: MatcherContext): boolean {
  if (!fields) return false;
  const results = collectResults(fields, ctx);
  if (results.length === 0) return false;
  const mode = fields.mode ?? 'ALL';
  return mode === 'ANY' ? results.some((r) => r) : results.every((r) => r);
}

function evaluateExclude(fields: MatcherFields | undefined, ctx: MatcherContext): boolean {
  if (!fields) return false;
  const results = collectResults(fields, ctx);
  if (results.length === 0) return false;
  return results.some((r) => r);
}

function evaluateLabel(label: Label, ctx: MatcherContext): boolean {
  return evaluateInclude(label.include, ctx) && !evaluateExclude(label.exclude, ctx);
}

export async function labels(client: InstanceType<typeof GitHub>, config: Config): Promise<string[]> {
  if (!config.labels?.length) {
    return [];
  }

  const ctx = await buildContext(client, config);
  const matched = config.labels.filter((label) => evaluateLabel(label, ctx)).map((label) => label.label);

  return mergeLabels(matched, config);
}
