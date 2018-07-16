// tslint:disable:no-eval
import * as assert from 'power-assert';

// tslint:disable-next-line:no-relative-imports
import { buildModuleString, bundle, createAsset, createGraph, IAsset, Identifier } from '../src/minipack';

const sampleGraph1: IAsset[] = [
  {
    id: 1,
    filename: 'sample.js',
    mapping: {
      key1: 1,
      key2: 2,
    },
    dependencies: [],
    code: 'console.log("Call function");',
  },
];

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
  describe('createAsset', () => {
    it('Create example asset', () => {
      const expected: IAsset = {
        id: 0,
        filename: './example/entry.js',
        dependencies: ['./message.js'],
        code:
          '"use strict";\n\nvar _message = _interopRequireDefault(require("./message.js"));\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }\n\nconsole.log(_message.default);',
        mapping: {},
      };
      const identifier: Identifier = new Identifier();
      const actual: IAsset = createAsset('./example/entry.js', identifier);
      assert.deepEqual(actual, expected);
    });
  });

  describe('createGraph', () => {
    it('Create example asset', () => {
      const expected: IAsset[] = [
        {
          id: 0,
          filename: './example/entry.js',
          dependencies: ['./message.js'],
          code:
            '"use strict";\n\nvar _message = _interopRequireDefault(require("./message.js"));\n\nfunction _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }\n\nconsole.log(_message.default);',
          mapping: { './message.js': 1 },
        },
        {
          id: 1,
          filename: 'example/message.js',
          dependencies: ['./name.js'],
          // tslint:disable-next-line:no-invalid-template-strings
          code:
            '"use strict";\n\nObject.defineProperty(exports, "__esModule", {\n  value: true\n});\nexports.default = void 0;\n\nvar _name = require("./name.js");\n\nvar _default = "hello ".concat(_name.name, "!");\n\nexports.default = _default;',
          mapping: { './name.js': 2 },
        },
        {
          id: 2,
          filename: 'example/name.js',
          dependencies: [],
          code:
            '"use strict";\n\nObject.defineProperty(exports, "__esModule", {\n  value: true\n});\nexports.name = void 0;\nvar name = \'world\';\nexports.name = name;',
          mapping: {},
        },
      ];
      const actual: IAsset[] = createGraph('./example/entry.js');
      assert.deepEqual(actual, expected);
    });
  });

  describe('buildModuleString', () => {
    it('Single module graph', () => {
      const mod1: IAsset = sampleGraph1[0];
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
      const actual: string = bundle(buildModuleString(sampleGraph1));

      // tslint:disable-next-line:no-eval
      assert.doesNotThrow(() => eval(actual));
      assert.equal(minifyForCompare(actual), minifyForCompare(expected));
    });
  });

  describe('End to End', () => {
    it('runable', () => {
      const entryPoint: string = './example/entry.js';
      const graph: IAsset[] = createGraph(entryPoint);
      const moduleString: string = buildModuleString(graph);
      const result: string = bundle(moduleString);
      const actual: string = minifyForCompare(result);
      assert.doesNotThrow(() => eval(actual));
    });
  });
});
