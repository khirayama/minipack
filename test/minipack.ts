import * as assert from 'power-assert';

import { bundle, createGraph } from 'minipack';

const entryPoint: string = './example/entry.js';

describe('minipack', () => {
  describe('bundle', () => {
  });

  describe('createGraph', () => {
  });

  it('result', () => {
    const graph: string = createGraph(entryPoint);
    const result: string = bundle(graph);

    // tslint:disable-next-line:no-console
    console.log('result: ', result);
    assert.equal(result, './example/entry.js');
  });
});
