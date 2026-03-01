import { MatcherFields } from '../config';
import { matcherRegex } from './utils';

export function test(fields: MatcherFields, ref: string | undefined): boolean {
  return matcherRegex({ regex: fields.baseBranch, text: ref ?? '' });
}
