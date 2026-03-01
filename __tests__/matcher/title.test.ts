import { test } from '../../src/matcher/title';

describe('title', () => {
  it('should return false when title field is undefined', () => {
    expect(test({}, 'feat: spaceship')).toBe(false);
  });

  it('should return false when text is undefined', () => {
    expect(test({ title: '^feat: .+' }, undefined)).toBe(false);
  });

  it('should not match', () => {
    expect(test({ title: '^feat: .+' }, 'nothing interesting')).toBe(false);
  });

  describe('matching', () => {
    it('should match feat', () => {
      expect(test({ title: '^feat: .+' }, 'feat: spaceship')).toBe(true);
    });

    it('should match fix', () => {
      expect(test({ title: '^fix: .+' }, 'fix: typo')).toBe(true);
    });

    it('should match docs', () => {
      expect(test({ title: '^docs: .+' }, 'docs: update readme')).toBe(true);
    });

    it('should match chore', () => {
      expect(test({ title: '^chore: .+' }, 'chore: update deps')).toBe(true);
    });
  });
});
