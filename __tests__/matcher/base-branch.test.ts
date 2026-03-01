import { test } from '../../src/matcher/base-branch';

describe('base-branch', () => {
  it('should return false when baseBranch field is undefined', () => {
    expect(test({}, 'release/1.0')).toBe(false);
  });

  it('should return false when ref is undefined', () => {
    expect(test({ baseBranch: '^release/.*' }, undefined)).toBe(false);
  });

  it('should not match', () => {
    expect(test({ baseBranch: '^release/.*' }, 'main')).toBe(false);
  });

  it('should match release branch', () => {
    expect(test({ baseBranch: '^release/.*' }, 'release/1.0')).toBe(true);
  });

  it('should match master', () => {
    expect(test({ baseBranch: 'master' }, 'master')).toBe(true);
  });

  it('should not match main when looking for master', () => {
    expect(test({ baseBranch: 'master' }, 'main')).toBe(false);
  });
});
