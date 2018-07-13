export interface IModule {
  id: any;
  mapping: any;
  code: any;
}

export function createGraph(entryPoint: string): IModule[] {
  return [{
    id: 1,
    mapping: 'mapping',
    code: 'code',
  }];
}

export function buildModuleString(graph: IModule[]): string {
  let moduleString: string = '';

  graph.forEach((mod: IModule) => {
    moduleString += `${mod.id}: [
      function(require, module, exports) {
        ${mod.code}
      },
      ${JSON.stringify(mod.mapping)}
    ],`;
  });

  return moduleString;
}

export function bundle(graph: IModule[]): string {
  const moduleString: string = buildModuleString(graph);

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
