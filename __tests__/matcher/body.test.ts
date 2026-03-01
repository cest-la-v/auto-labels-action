import { test } from '../../src/matcher/body';

describe('body', () => {
  it('should return false when body field is undefined', () => {
    expect(test({}, 'some body text')).toBe(false);
  });

  it('should return false when text is undefined', () => {
    expect(test({ body: 'checkbox' }, undefined)).toBe(false);
  });

  it('should not match', () => {
    expect(test({ body: '(\\n|.)*- \\[x\\] checkbox(\\n|.)*' }, 'nothing')).toBe(false);
  });

  it('should match checkbox', () => {
    expect(
      test({ body: '(\\n|.)*- \\[x\\] checkbox(\\n|.)*' }, 'What is the issue:\n- [x] checkbox\n- [ ] no problem'),
    ).toBe(true);
  });

  it('should match checkbox with newline', () => {
    expect(
      test(
        { body: '(\\n|.)*- \\[x\\] checkbox(\\n|.)*' },
        'What is the issue\nnewline:\n- [x] checkbox\n- [ ] no problem',
      ),
    ).toBe(true);
  });

  it('should match something', () => {
    expect(test({ body: '.* something .*' }, 'this is something here')).toBe(true);
  });
});

