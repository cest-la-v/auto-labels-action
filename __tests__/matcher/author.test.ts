import { test } from '../../src/matcher/author';

describe('author', () => {
  it('should return false when author field is undefined', () => {
    expect(test({}, 'fuxingloh')).toBe(false);
  });

  it('should return false when login is undefined', () => {
    expect(test({ author: 'fuxingloh' }, undefined)).toBe(false);
  });

  it('should not match non-listed author', () => {
    expect(test({ author: 'fuxingloh' }, 'github-actions')).toBe(false);
  });

  it('should match string author', () => {
    expect(test({ author: 'fuxingloh' }, 'fuxingloh')).toBe(true);
  });

  it('should match within array', () => {
    expect(test({ author: ['fuxingloh', 'claire', 'adam'] }, 'fuxingloh')).toBe(true);
    expect(test({ author: ['fuxingloh', 'claire', 'adam'] }, 'claire')).toBe(true);
    expect(test({ author: ['fuxingloh', 'claire', 'adam'] }, 'adam')).toBe(true);
  });

  it('should not match author not in array', () => {
    expect(test({ author: ['dragon'] }, 'tiger')).toBe(false);
  });
});
