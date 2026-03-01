import { MatcherFields } from '../config';

export function test(fields: MatcherFields, author: string | undefined): boolean {
  const authors = typeof fields.author === 'string' ? [fields.author] : fields.author ?? [];
  if (!authors.length) return false;
  return author !== undefined && authors.includes(author);
}
