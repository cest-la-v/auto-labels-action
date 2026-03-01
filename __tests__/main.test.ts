import fs from 'fs';
import { parse } from '../src/config';

it('.github/labels.yml', function () {
  const content = fs.readFileSync(`.github/labels.yml`, 'utf8');
  expect(() => parse(content)).not.toThrowError();
});
