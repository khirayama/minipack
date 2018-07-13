import * as assert from 'power-assert';

import { buildModuleString, bundle, createGraph, IModule } from 'minipack';

const sampleGraph1: IModule[] = [{
  id: 1,
  mapping: {
    key1: 'val1',
    key2: 'val2',
  },
  code: 'console.log("Call function");',
}];


function minifyForCompare(str: string): string {
  const lines: string[] = str.split('\n');
  let result: string = '';
  result += lines.map((line: string) => line.trim()).join('');

  return result;
}

describe('minifyForCompare', () => {
  it('Simple sample', () => {
    assert.equal(minifyForCompare('abc\n  defg'), 'abcdefg');
  });
});

describe('minipack', () => {

  describe('createGraph', () => {
  });

  describe('buildModuleString', () => {
    it('Single module graph', () => {
      const mod1: IModule = sampleGraph1[0];
      const expected: string = `
        ${mod1.id}: [function(require, module, exports) {
          ${mod1.code}
        },${JSON.stringify(mod1.mapping)}],
      `;
      const actual: string = buildModuleString(sampleGraph1);

      assert.equal(minifyForCompare(actual), minifyForCompare(expected));
    });
  });

  describe('bundle', () => {
    it('Single module graph', () => {
      const expected: string = `
        (function(modules) {
          function require(id) {
            const mod = modules[id];
            if (!mod) {
              return;
            }

            const [fn, mapping] = modules[id];

            function localRequire(name) {
              return require(mapping[name]);
            }

            const module = {
              exports: {},
            };

            fn(localRequire, module, module.exports);

            return module.exports;
          }

          require(0);
        })({${buildModuleString(sampleGraph1)}});
      `;
      const actual: string = bundle(sampleGraph1);

      // tslint:disable-next-line:no-eval
      assert.doesNotThrow(() => eval(actual));
      assert.equal(minifyForCompare(actual), minifyForCompare(expected));
    });
  });

  describe('End to End', () => {
    it('runable', () => {
      // const entryPoint: string = './example/entry.js';
      // const graph: IModule[] = createGraph(entryPoint);
      // const result: string = bundle(graph);
      //
      // // tslint:disable-next-line:no-console
      // console.log('result: ', result);
      // assert.equal(result, './example/entry.js');
    });
  });
});
