import { MatcherFields } from '../config';
import { matcherRegexAny } from './utils';

export function test(fields: MatcherFields, messages: string[]): boolean {
  if (!fields.commits) return false;
  return matcherRegexAny(fields.commits, messages);
}
