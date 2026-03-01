import { test } from '../../src/matcher/files';

// File lists used in test scenarios (matching the original fixture data)
const files1 = [
  '.github/labeler.yml',
  'app/main.js',
  'security/main.js',
  'security/abc/abc.js',
  'setup/abc/abc.xml',
  'setup/abc/abc.js',
];
const files2 = ['.github/labeler.yml'];
const files3 = ['app/main.js', 'setup/abc/abc.js', 'test/abc/abc.js'];
const files4 = ['security/main.js'];
const files5 = ['security/abc/abc.js'];
const files6 = ['setup/abc/abc.xml'];
const files7 = ['setup/abc/abc.js', '1/abc/abc.js', '3/abc/abc.js'];
const files8 = ['app/1.js', 'app/2.js', 'app/3.js'];

describe('basic (string & array patterns)', () => {
  it('should return false with no files field', () => {
    expect(test({}, files1)).toBe(false);
  });

  describe('security (array pattern)', () => {
    const fields = { files: ['security/**', 'setup/**/*.xml'] };
    it('files1 should match security', () => expect(test(fields, files1)).toBe(true));
    it('files2 should not match', () => expect(test(fields, files2)).toBe(false));
    it('files3 should not match', () => expect(test(fields, files3)).toBe(false));
    it('files4 should match', () => expect(test(fields, files4)).toBe(true));
    it('files5 should match', () => expect(test(fields, files5)).toBe(true));
    it('files6 should match (setup/**/*.xml)', () => expect(test(fields, files6)).toBe(true));
    it('files7 should not match', () => expect(test(fields, files7)).toBe(false));
  });

  describe('app (string pattern)', () => {
    const fields = { files: 'app/**' };
    it('files1 should match', () => expect(test(fields, files1)).toBe(true));
    it('files2 should not match', () => expect(test(fields, files2)).toBe(false));
    it('files3 should match', () => expect(test(fields, files3)).toBe(true));
    it('files4 should not match', () => expect(test(fields, files4)).toBe(false));
  });

  describe('labeler (exact file path)', () => {
    const fields = { files: '.github/labeler.yml' };
    it('files1 should match', () => expect(test(fields, files1)).toBe(true));
    it('files2 should match', () => expect(test(fields, files2)).toBe(true));
    it('files3 should not match', () => expect(test(fields, files3)).toBe(false));
  });
});

describe('complex (any/all/count)', () => {
  describe('all-app', () => {
    const fields = { files: { all: ['app/**'] } };
    it('files1 should not match (has non-app files)', () => expect(test(fields, files1)).toBe(false));
    it('files8 should match (all app)', () => expect(test(fields, files8)).toBe(true));
    it('files4 should not match (no app files)', () => expect(test(fields, files4)).toBe(false));
  });

  describe('any-app', () => {
    const fields = { files: { any: ['app/**'] } };
    it('files1 should match', () => expect(test(fields, files1)).toBe(true));
    it('files3 should match', () => expect(test(fields, files3)).toBe(true));
    it('files8 should match', () => expect(test(fields, files8)).toBe(true));
    it('files2 should not match', () => expect(test(fields, files2)).toBe(false));
  });

  describe('none-app (all: !app/**)', () => {
    const fields = { files: { all: ['!app/**'] } };
    it('files2 should match (no app files)', () => expect(test(fields, files2)).toBe(true));
    it('files4 should match (no app files)', () => expect(test(fields, files4)).toBe(true));
    it('files1 should not match (has app/main.js)', () => expect(test(fields, files1)).toBe(false));
  });

  describe('count: eq', () => {
    const fields = { files: { count: { eq: 1 } } };
    it('files2 should match (1 file)', () => expect(test(fields, files2)).toBe(true));
    it('files4 should match (1 file)', () => expect(test(fields, files4)).toBe(true));
    it('files1 should not match (6 files)', () => expect(test(fields, files1)).toBe(false));
  });

  describe('count: neq', () => {
    const fields = { files: { count: { neq: 1 } } };
    it('files1 should match (6 != 1)', () => expect(test(fields, files1)).toBe(true));
    it('files3 should match (3 != 1)', () => expect(test(fields, files3)).toBe(true));
    it('files2 should not match (1 == 1)', () => expect(test(fields, files2)).toBe(false));
  });

  describe('count: gte/lte range (M: 2-5)', () => {
    const fields = { files: { count: { gte: 2, lte: 5 } } };
    it('files3 should match (3 files)', () => expect(test(fields, files3)).toBe(true));
    it('files7 should match (3 files)', () => expect(test(fields, files7)).toBe(true));
    it('files2 should not match (1 file)', () => expect(test(fields, files2)).toBe(false));
    it('files1 should not match (6 files)', () => expect(test(fields, files1)).toBe(false));
  });

  describe('count: gte (L: >= 6)', () => {
    const fields = { files: { count: { gte: 6 } } };
    it('files1 should match (6 files)', () => expect(test(fields, files1)).toBe(true));
    it('files3 should not match (3 files)', () => expect(test(fields, files3)).toBe(false));
  });

  describe('any + all + count combined', () => {
    const fields = { files: { any: ['security/**', 'setup/**'], all: ['!app/**'], count: {} } };
    it('files4 should match (security, no app)', () => expect(test(fields, files4)).toBe(true));
    it('files5 should match (security, no app)', () => expect(test(fields, files5)).toBe(true));
    it('files6 should match (setup, no app)', () => expect(test(fields, files6)).toBe(true));
    it('files1 should not match (has app/)', () => expect(test(fields, files1)).toBe(false));
  });

  describe('mutually exclusive count constraints', () => {
    const fields = { files: { count: { eq: 1, neq: 1 } } };
    it('should never match (eq: 1 AND neq: 1 is impossible)', () => {
      expect(test(fields, files2)).toBe(false);
    });
  });
});
