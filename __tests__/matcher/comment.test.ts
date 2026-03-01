import { test } from '../../src/matcher/comment';

describe('comment', () => {
  it('should return false when comment field is undefined', () => {
    expect(test({}, '/stale')).toBe(false);
  });

  it('should return false when text is undefined', () => {
    expect(test({ comment: '/stale' }, undefined)).toBe(false);
  });

  it('should not match', () => {
    expect(test({ comment: '(\\n|.)*- \\[x\\] checkbox(\\n|.)*' }, 'nothing')).toBe(false);
  });

  it('should match checkbox', () => {
    expect(
      test({ comment: '(\\n|.)*- \\[x\\] checkbox(\\n|.)*' }, 'What is the issue:\n- [x] checkbox\n- [ ] no problem'),
    ).toBe(true);
  });

  it('should match checkbox with newline', () => {
    expect(
      test(
        { comment: '(\\n|.)*- \\[x\\] checkbox(\\n|.)*' },
        'What is the issue\nnewline:\n- [x] checkbox\n- [ ] no problem',
      ),
    ).toBe(true);
  });

  it('should match stale', () => {
    expect(test({ comment: '/stale' }, '/stale')).toBe(true);
  });
});
