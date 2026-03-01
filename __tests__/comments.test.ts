import * as github from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';
import { postComment } from '../src/comments';
import { Config } from '../src/config';

const mockCreateComment = jest.fn().mockResolvedValue({});

const client: InstanceType<typeof GitHub> = {
  rest: {
    issues: {
      // @ts-ignore
      createComment: mockCreateComment,
    },
  },
};

const baseConfig: Config = {
  version: 'v1',
};

const configWithComments: Config = {
  version: 'v1',
  comments: {
    issues: 'Thanks for opening this issue!\nPlease review the labels.',
    prs: 'Thanks for the contribution!\nPlease review the labels.',
  },
};

beforeEach(() => {
  mockCreateComment.mockClear();
});

describe('postComment for pull_request event', () => {
  beforeEach(() => {
    Object.defineProperty(github.context, 'payload', {
      value: {
        pull_request: { number: 42, head: { sha: 'abc123' } },
      },
      writable: true,
    });
    Object.defineProperty(github.context, 'repo', {
      value: { owner: 'test-owner', repo: 'test-repo' },
      writable: true,
    });
  });

  it('posts prs comment on pull_request event', async () => {
    await postComment(client, configWithComments, 42);

    expect(mockCreateComment).toHaveBeenCalledTimes(1);
    expect(mockCreateComment).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      issue_number: 42,
      body: configWithComments.comments!.prs,
    });
  });

  it('does not post when prs comment is absent', async () => {
    const config: Config = { version: 'v1', comments: { issues: 'issue message' } };
    await postComment(client, config, 42);
    expect(mockCreateComment).not.toHaveBeenCalled();
  });

  it('does not post when comments config is absent', async () => {
    await postComment(client, baseConfig, 42);
    expect(mockCreateComment).not.toHaveBeenCalled();
  });

  it('does not post when prs comment is whitespace only', async () => {
    const config: Config = { version: 'v1', comments: { prs: '   ' } };
    await postComment(client, config, 42);
    expect(mockCreateComment).not.toHaveBeenCalled();
  });
});

describe('postComment for issues event', () => {
  beforeEach(() => {
    Object.defineProperty(github.context, 'payload', {
      value: {
        issue: { number: 7 },
      },
      writable: true,
    });
    Object.defineProperty(github.context, 'repo', {
      value: { owner: 'test-owner', repo: 'test-repo' },
      writable: true,
    });
  });

  it('posts issues comment on issue event', async () => {
    await postComment(client, configWithComments, 7);

    expect(mockCreateComment).toHaveBeenCalledTimes(1);
    expect(mockCreateComment).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      issue_number: 7,
      body: configWithComments.comments!.issues,
    });
  });

  it('does not post when issues comment is absent', async () => {
    const config: Config = { version: 'v1', comments: { prs: 'pr message' } };
    await postComment(client, config, 7);
    expect(mockCreateComment).not.toHaveBeenCalled();
  });

  it('does not post when comments config is absent', async () => {
    await postComment(client, baseConfig, 7);
    expect(mockCreateComment).not.toHaveBeenCalled();
  });

  it('does not post when issues comment is whitespace only', async () => {
    const config: Config = { version: 'v1', comments: { issues: '\n  \n' } };
    await postComment(client, config, 7);
    expect(mockCreateComment).not.toHaveBeenCalled();
  });
});
