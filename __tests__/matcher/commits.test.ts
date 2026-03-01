import { test } from '../../src/matcher/commits';

describe('commits', () => {
  it('should return false when commits field is undefined', () => {
    expect(test({}, ['feat: some commit'])).toBe(false);
  });

  it('should return false with no messages', () => {
    expect(test({ commits: '^feat: .*' }, [])).toBe(false);
  });

  it('should not match when no commits match pattern', () => {
    expect(test({ commits: '^feat: .*' }, ['no-commit:', 'commit: commit'])).toBe(false);
  });

  it('should match when any commit matches pattern', () => {
    expect(test({ commits: '^feat: .*' }, ['init', 'feat: yes yes yes'])).toBe(true);
  });

  it('should match with single matching commit', () => {
    expect(test({ commits: '^feat: .*' }, ['feat: spaceship'])).toBe(true);
  });
});
