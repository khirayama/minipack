import * as assert from 'power-assert';

import { add } from 'minipack';

describe('minipack', () => {
  describe('add', () => {
    it('default', () => {
      assert.equal(add(1, 2), 3);
    });
  });
});
