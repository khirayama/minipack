// Doc: https://github.com/ronami/minipack
// Doc: https://babeljs.io/docs/en/next/index.html
// Doc: https://github.com/jamiebuilds/babel-handbook/blob/master/translations/ja/plugin-handbook.md
import * as fs from 'fs';
import * as path from 'path';

import * as babel from '@babel/core';
import traverse from '@babel/traverse';

export interface IAsset {
  id: number;
  filename: string;
  mapping: {
    [key: string]: number;
  };
  dependencies: string[];
  code: string;
}

export class Identifier {
  public id: number = 0;

  public getAndInclement(): number {
    const id: number = this.id;
    this.id += 1;

    return id;
  }
}

export function createAsset(filename: string, identifier: Identifier): IAsset {
  const content: string = fs.readFileSync(filename, 'utf-8');

  // https://github.com/babel/babel/blob/98ff2ce87747df3a62fff97a508af5451ba12eae/packages/babel-core/src/transform-ast.js
  // type AstRoot = BabelNodeFile | BabelNodeProgram;
  // tslint:disable-next-line:no-any
  const ast: any = babel.parse(content, {
    sourceType: 'module',
  });

  const dependencies: string[] = [];

  traverse(ast, {
    // tslint:disable-next-line:no-any
    enter(astPath: any): void {
      if (astPath.node.source) {
        dependencies.push(astPath.node.source.value);
      }
    },
  });

  // tslint:disable-next-line:no-any
  const babelOptions: any = {
    presets: ['@babel/preset-env'],
  };

  // https://github.com/babel/babel/blob/98ff2ce87747df3a62fff97a508af5451ba12eae/packages/babel-core/src/transform-ast.js#L24
  // FileResult
  // tslint:disable-next-line:no-any
  const res: any = babel.transformFromAstSync(ast, content, babelOptions);

  const id: number = identifier.getAndInclement();

  return {
    id: id,
    filename,
    dependencies,
    code: res.code,
    mapping: {},
  };
}

export function createGraph(entryFilename: string): IAsset[] {
  const identifier: Identifier = new Identifier();

  const rootAsset: IAsset = createAsset(entryFilename, identifier);

  const graph: IAsset[] = [rootAsset];

  for (const asset of graph) {
    const dirname: string = path.dirname(asset.filename);

    asset.dependencies.forEach((relativePath: string) => {
      const absolutePath: string = path.join(dirname, relativePath);
      const child: IAsset = createAsset(absolutePath, identifier);
      asset.mapping[relativePath] = child.id;
      graph.push(child);
    });
  }

  return graph;
}

export function buildModuleString(graph: IAsset[]): string {
  let moduleString: string = '';

  graph.forEach((mod: IAsset) => {
    moduleString += `${mod.id}: [
      function(require, module, exports) {
        ${mod.code}
      },
      ${JSON.stringify(mod.mapping)}
    ],`;
  });

  return moduleString;
}

export function bundle(moduleString: string): string {
  return `
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
    })({${moduleString}});
  `;
}
