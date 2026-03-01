import * as github from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';
import { Config } from './config';

/**
 * Posts a comment on the issue or pull request if a comment is configured.
 * For pull request events the `comments.prs` message is used; for issue events
 * the `comments.issues` message is used. No comment is posted when the relevant
 * message is absent or empty.
 */
export async function postComment(
  client: InstanceType<typeof GitHub>,
  config: Config,
  issueNumber: number,
): Promise<void> {
  const isPR = !!github.context.payload.pull_request;
  const message = isPR ? config.comments?.prs : config.comments?.issues;

  if (!message?.trim()) {
    return;
  }

  await client.rest.issues.createComment({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issueNumber,
    body: message,
  });
}
