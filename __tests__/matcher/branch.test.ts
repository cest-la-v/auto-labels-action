import { test } from '../../src/matcher/branch';

describe('branch', () => {
  it('should return false when branch field is undefined', () => {
    expect(test({}, 'feat/spaceship')).toBe(false);
  });

  it('should return false when ref is undefined', () => {
    expect(test({ branch: '^feat/.*' }, undefined)).toBe(false);
  });

  it('should not match', () => {
    expect(test({ branch: '^feat/.*' }, 'spaceship')).toBe(false);
  });

  it('should match feat branch', () => {
    expect(test({ branch: '^feat/.*' }, 'feat/spaceship')).toBe(true);
  });
});

