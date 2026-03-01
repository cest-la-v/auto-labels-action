import { MatcherFields } from '../config';
import { matcherRegex } from './utils';

export function test(fields: MatcherFields, text: string | undefined): boolean {
  return matcherRegex({ regex: fields.body, text: text ?? '' });
}
