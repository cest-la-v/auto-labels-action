import { MatcherFields } from '../config';
import { Minimatch } from 'minimatch';

/**
 * if globs is empty = matched
 * if globs is not empty, any files must match
 */
function anyMatch(files: string[], globs: string[]): boolean {
  if (!globs.length) {
    return true;
  }

  const matchers = globs.map((g) => new Minimatch(g));

  for (const matcher of matchers) {
    for (const file of files) {
      if (matcher.match(file)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * if globs is empty = matched
 * if globs is not empty, all files must match
 */
function allMatch(files: string[], globs: string[]): boolean {
  if (!globs.length) {
    return true;
  }

  const matchers = globs.map((g) => new Minimatch(g));

  for (const matcher of matchers) {
    for (const file of files) {
      if (!matcher.match(file)) {
        return false;
      }
    }
  }

  return true;
}

interface FileCountMatcher {
  lte?: number;
  gte?: number;
  eq?: number;
  neq?: number;
}

/**
 * if count not available, return true
 * else all count pattern must match,
 * ignored if any are undefined
 */
function countMatch(files: string[], count?: FileCountMatcher): boolean {
  if (!count) {
    return true;
  }

  return (
    (count?.eq === undefined || count.eq === files.length) &&
    (count?.neq === undefined || count.neq !== files.length) &&
    (count?.lte === undefined || count.lte >= files.length) &&
    (count?.gte === undefined || count.gte <= files.length)
  );
}

export function test(fields: MatcherFields, files: string[]): boolean {
  const filesField = fields.files;

  if (typeof filesField === 'string') {
    return anyMatch(files, [filesField]);
  }

  if (Array.isArray(filesField)) {
    return anyMatch(files, filesField);
  }

  if (filesField) {
    const anyGlobs = filesField.any ?? [];
    const allGlobs = filesField.all ?? [];
    const count = filesField.count;
    return anyMatch(files, anyGlobs) && allMatch(files, allGlobs) && countMatch(files, count);
  }

  return false;
}
