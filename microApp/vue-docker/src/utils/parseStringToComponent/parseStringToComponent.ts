import * as acorn from 'acorn';
import { ancestor } from 'acorn-walk';
import ts from 'typescript';
import { Register } from './register';

export class LegalStringCheck {
  _componentInfo: any | null = null;
  _legalExtension: string[] | null = null;
  constructor(componentInfo: any, legalExtension: string[]) {
    this._componentInfo = componentInfo;
    this._legalExtension = legalExtension;
  }

  get componentInfo() {
    if (!this._componentInfo) throw new Error('componentInfo应该被初始化!');
    return this._componentInfo;
  }

  get legalExtension() {
    if (!this._legalExtension) throw new Error('legalExtension应该被初始化!');
    return this._legalExtension;
  }

  async checkPackageExtendLegal(fileName: string) {
    fileName = fileName.split(';')[0].trim();
    if (!this.legalExtension.some((ext) => fileName.endsWith(ext))) {
      throw new Error('错误的包拓展名！');
    }
  }

  async checkPackageNotFromOuter(fileName: string) {
    const relaventImports = [
      ...this.componentInfo.relevantPackages,
      ...this.componentInfo.externalFiles.map((file: any) => file.fileName),
    ];
    if (!relaventImports.includes(fileName))
      throw new Error('不要在编辑器中引入外部包！');
  }

  checkIsLegalPackage(fileName: string) {
    return Promise.all([
      this.checkPackageExtendLegal(fileName),
      this.checkPackageNotFromOuter(fileName),
    ]);
  }
}

export class CommonParseTools {
  static clearExportKeyWords = (codeContent: string) => {
    // export { a, b, c as d };
    codeContent.match(/export\s+\{([^}]+)\};/g)?.forEach((item) => {
      codeContent = codeContent.replace(item, '');
    });
    // export { a, b } from './module';
    codeContent
      .match(/export\s+\{([^}]+)\}\s+from\s+['"][^'"]+['"];/g)
      ?.forEach((item) => {
        codeContent = codeContent.replace(item, '');
      });
    // export { default } from './module';
    codeContent
      .match(/export\s+\{default\}\s+from\s+['"][^'"]+['"];/g)
      ?.forEach((item) => {
        codeContent = codeContent.replace(item, '');
      });
    // export * from './module';
    codeContent
      .match(/export\s+\*\s+from\s+['"][^'"]+['"];/g)
      ?.forEach((item) => {
        codeContent = codeContent.replace(item, '');
      });
    // export * as Utils from './utils.js';
    codeContent
      .match(/export\s+\*\s+as\s+([a-zA-Z_$][\w$]*)\s+from\s+['"][^'"]+['"];/g)
      ?.forEach((item) => {
        codeContent = codeContent.replace(item, '');
      });
    return codeContent
      .replace(/export\s+default\s+/g, '') // 删除 `export default`
      .replace(
        /export\s+({[^}]+}|\w+\s*|\w+\s*\([^)]*\)\s*|\w+\s+class)/g,
        '$1',
      );
  };

  static getDeclarationFromContent = (codeContent: string) => {
    const ast = acorn.parse(codeContent, {
      sourceType: 'module',
      ecmaVersion: 'latest',
    });

    // 提取所有的变量和声明
    const declarations: any = [];

    // 遍历 AST 提取变量声明、函数声明、类声明
    function extractDeclarations(node: any) {
      if (node.type === 'VariableDeclaration') {
        // 处理变量声明
        node.declarations.forEach((declaration: any) => {
          declarations.push({
            type: 'VariableDeclaration',
            name: declaration.id.name,
            kind: node.kind, // const, let, var
          });
        });
      } else if (node.type === 'FunctionDeclaration') {
        // 处理函数声明
        declarations.push({
          type: 'FunctionDeclaration',
          name: node.id.name,
        });
      } else if (node.type === 'ClassDeclaration') {
        // 处理类声明
        declarations.push({
          type: 'ClassDeclaration',
          name: node.id.name,
        });
      }
    }

    // 遍历 AST
    function traverseNode(node: any) {
      extractDeclarations(node);
      for (const key in node) {
        if (node[key] && typeof node[key] === 'object') {
          traverseNode(node[key]);
        }
      }
    }

    // 开始遍历 AST
    traverseNode(ast);

    return declarations;
  };

  static getFunctionAndReturn = (codeContent: any) => {
    const ast = acorn.parse(codeContent, {
      ecmaVersion: 2020,
      sourceType: 'module',
    });
    const results: any = [];

    function getFunctionName(node: any, ancestors: any) {
      // 查找函数的名称
      if (node.id && node.id.name) {
        return node.id.name; // 具名函数
      }

      const parent = ancestors[ancestors.length - 2]; // 获取父节点
      if (parent) {
        if (
          parent.type === 'VariableDeclarator' &&
          parent.id.type === 'Identifier'
        ) {
          return parent.id.name; // 变量赋值的函数
        }
        if (parent.type === 'Property' && parent.key.type === 'Identifier') {
          return parent.key.name; // 对象方法
        }
      }

      return '<anonymous>'; // 匿名函数
    }

    function extractReturnValue(node: any) {
      if (node.type === 'ReturnStatement' && node.argument) {
        if (node.argument.type === 'Literal') {
          return node.argument.value; // 直接返回字面量
        } else if (node.argument.type === 'BinaryExpression') {
          return '<expression>'; // 复杂表达式返回值
        } else if (node.argument.type === 'CallExpression') {
          if (
            node.argument.callee?.object?.name === 'React' &&
            node.argument.callee?.property?.name === 'createElement'
          ) {
            return '<component>';
          }
        }

        return '<non-literal>'; // 其他类型
      } else if (node.type === 'ArrowFunctionExpression' && node.body) {
        if (node.body.type === 'BlockStatement') {
          if (
            node.body.body[0].argument.callee?.object?.name === 'React' &&
            node.body.body[0].argument.callee?.property?.name ===
              'createElement'
          ) {
            return '<component>';
          }
        }
        if (node.body.type === 'Literal') {
          return node.body.value; // 直接返回字面量
        }
        return '<non-literal>'; // 复杂返回值
      }
      return null;
    }

    ancestor(ast, {
      FunctionDeclaration(node, ancestors) {
        const functionName = getFunctionName(node, ancestors);
        node.body.body.forEach((stmt) => {
          const returnValue = extractReturnValue(stmt);
          if (returnValue !== null) {
            results.push({ functionName, returnValue });
          }
        });
      },
      FunctionExpression(node, ancestors) {
        const functionName = getFunctionName(node, ancestors);
        node.body.body.forEach((stmt) => {
          const returnValue = extractReturnValue(stmt);
          if (returnValue !== null) {
            results.push({ functionName, returnValue });
          }
        });
      },
      ArrowFunctionExpression(node, ancestors) {
        const functionName = getFunctionName(node, ancestors);
        const returnValue = extractReturnValue(node);
        if (returnValue !== null) {
          results.push({ functionName, returnValue });
        }
      },
    });

    return results;
  };

  static getExportVariableFromContent = (codeContent: string) => {
    const ast = acorn.parse(codeContent, {
      sourceType: 'module',
      ecmaVersion: 'latest',
    });

    // 存储所有导出的变量和声明
    const exports: any[] = [];

    // 遍历 AST 提取导出相关的变量和声明
    function extractExports(node: any) {
      if (node.type === 'ExportNamedDeclaration') {
        // 具名导出
        if (node.declaration) {
          if (node.declaration.type === 'VariableDeclaration') {
            // 具名变量导出
            node.declaration.declarations.forEach((declaration: any) => {
              exports.push({
                type: 'VariableDeclaration',
                name: declaration.id.name,
                kind: node.declaration.kind, // const, let, var
              });
            });
          } else if (node.declaration.type === 'FunctionDeclaration') {
            // 具名函数导出
            exports.push({
              type: 'FunctionDeclaration',
              name: node.declaration.id.name,
            });
          } else if (node.declaration.type === 'ClassDeclaration') {
            // 具名类导出
            exports.push({
              type: 'ClassDeclaration',
              name: node.declaration.id.name,
            });
          }
        }
        // 处理具名导出的导入/重命名
        if (node.specifiers) {
          if (node.source) {
            node.specifiers.forEach((specifier: any) => {
              if (specifier.type === 'ExportSpecifier') {
                exports.push({
                  type: 'ExportSpecifier',
                  name: specifier.local.name,
                  exported: specifier.exported.name,
                  source: node.source.value,
                });
              }
            });
          } else {
            node.specifiers.forEach((specifier: any) => {
              if (specifier.type === 'ExportSpecifier') {
                exports.push({
                  type: 'ExportSpecifier',
                  name: specifier.local.name,
                  exported: specifier.exported.name,
                });
              }
            });
          }
        }
      } else if (node.type === 'ExportDefaultDeclaration') {
        // 默认导出
        if (node.declaration.type === 'FunctionDeclaration') {
          exports.push({
            type: 'FunctionDeclaration',
            name: node.declaration.id
              ? node.declaration.id.name
              : 'anonymous function',
          });
        } else if (node.declaration.type === 'ClassDeclaration') {
          exports.push({
            type: 'ClassDeclaration',
            name: node.declaration.id
              ? node.declaration.id.name
              : 'anonymous class',
          });
        } else {
          exports.push({
            type: 'ExportDefaultDeclaration',
            name: node.declaration.name,
          });
        }
      } else if (node.type === 'ExportAllDeclaration') {
        // 重新导出（*导出）
        exports.push({
          type: 'ExportAllDeclaration',
          source: node.source.value,
          exported: node.exported?.name,
        });
      }
    }

    // 遍历 AST
    function traverseNode(node: any) {
      extractExports(node);
      for (const key in node) {
        if (node[key] && typeof node[key] === 'object') {
          traverseNode(node[key]);
        }
      }
    }

    // 开始遍历 AST
    traverseNode(ast);

    return exports;
  };

  static getImportVariableFromContent = (codeContent: string) => {
    const ast = acorn.parse(codeContent, {
      sourceType: 'module',
      ecmaVersion: 'latest',
    });

    // 存储导入的变量
    const imports: any = [];

    // 遍历 AST 并提取 import 变量
    function extractImports(node: any) {
      if (node.type === 'ImportDeclaration') {
        node.specifiers.forEach((specifier: any) => {
          if (specifier.type === 'ImportSpecifier') {
            // 具名导入: import { a as b } from 'module';
            imports.push({
              type: 'NamedImport',
              imported: specifier.imported.name,
              local: specifier.local.name,
              source: node.source.value,
            });
          } else if (specifier.type === 'ImportDefaultSpecifier') {
            // 默认导入: import defaultExport from 'module';
            imports.push({
              type: 'DefaultImport',
              local: specifier.local.name,
              source: node.source.value,
            });
          } else if (specifier.type === 'ImportNamespaceSpecifier') {
            // 整体导入: import * as allExports from 'module';
            imports.push({
              type: 'NamespaceImport',
              local: specifier.local.name,
              source: node.source.value,
            });
          }
        });
      }
    }

    // 遍历 AST
    function traverseNode(node: any) {
      extractImports(node);
      for (const key in node) {
        if (node[key] && typeof node[key] === 'object') {
          traverseNode(node[key]);
        }
      }
    }

    // 开始解析
    traverseNode(ast);

    // 输出所有解析出的 import 变量
    return imports;
  };

  static tsxTransJsx = (codeContent: string) => {
    const result = ts.transpileModule(codeContent, {
      compilerOptions: {
        jsx: ts.JsxEmit.Preserve, // 保留 JSX 语法
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ESNext,
      },
    });

    return result.outputText;
  };

  static getImportStatementFileName = (importStatement: string) => {
    const regex =
      /import\s+[^'"]*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    const match = regex.exec(importStatement);
    const fileName = match ? match[1] || match[2] : '';
    return fileName;
  };
}

@Register
export default class ParseStringToComponent {
  static _parseLanguage: string | null = null;
  static _legalExtension: string[] | null = null;
  private _componentInfo: any | null = null;
  private _legalStringCheck: LegalStringCheck | null = null;

  constructor(componentInfo: any) {
    this._componentInfo = componentInfo;
    this._legalStringCheck = new LegalStringCheck(
      componentInfo,
      ParseStringToComponent._legalExtension as string[],
    );
    ParseStringToComponent.handleInstallDependence();
  }

  get componentInfo() {
    if (!this._componentInfo) throw new Error('组件信息需要被初始化!');
    return this._componentInfo;
  }

  static get parseLanguage() {
    if (!ParseStringToComponent._parseLanguage)
      throw new Error('parseLanguage需要被注册!');
    return ParseStringToComponent._parseLanguage;
  }

  static get legalExtension() {
    if (!ParseStringToComponent._legalExtension)
      throw new Error('legalExtension需要被注册!');
    return ParseStringToComponent._legalExtension;
  }

  static handleInstallDependence() {
    if (typeof window === 'undefined') return;
    if (!(window as any)._components) (window as any)._components = {};
    if (!(window as any).modulesMap) (window as any).modulesMap = {};
  }

  async handleGetFileContent(fileName: string): Promise<any> {
    throw new Error('handleGetFileContent方法需要被注册!');
  }

  async parseImportContent(importStateMent: string) {
    const imports =
      CommonParseTools.getImportVariableFromContent(importStateMent);
    for (let i = 0; i < imports.length; i++) {
      const target = this.componentInfo.externalFiles.find(
        (file: any) => file.fileName === imports[i].source,
      );
      if (target) {
        document.getElementById(target.fileName)?.remove();
        const script = document.createElement('script');
        script.id = target.fileName;
        script.src = target.filePath;
        document.head.appendChild(script);
        await new Promise((resolve) => {
          script.onload = () => {
            resolve(null);
          };
          script.onerror = () => {
            resolve(null);
          };
        });
        return '';
      }
      if (this.componentInfo.relevantPackages.includes(imports[i].source)) {
        const importContent = await this.handleGetFileContent(
          imports[i].source,
        );
        this.generateModuleValue(
          imports[i].source,
          CommonParseTools.tsxTransJsx(importContent),
        );
        return `
        ${imports
          .map((item: any) => {
            return `const ${item.local} = window.modulesMap['${item.source}']['${item.imported ? item.imported : item.local}'];\n`;
          })
          .join('')}
      `;
      }
    }
  }

  async generateModuleValue(fileName: string, moduleContent: string) {
    (window as any).modulesMap[fileName] = {};
    const declarations =
      CommonParseTools.getDeclarationFromContent(moduleContent);
    const exports =
      CommonParseTools.getExportVariableFromContent(moduleContent);
    moduleContent = CommonParseTools.clearExportKeyWords(moduleContent);
    const outerExports = exports.filter((item) => item.source);
    for (let i = 0; i < outerExports.length; i++) {
      const outerExportContent = await this.handleGetFileContent(
        outerExports[i].source,
      );
      this.generateModuleValue(
        outerExports[i].source,
        CommonParseTools.tsxTransJsx(outerExportContent),
      );
    }
    const functionString = `
    (function(){
        ${exports
          .filter((item) => item.source)
          .map((item) => {
            // 有具体导出名字
            if (item.name) {
              return `window.modulesMap['${fileName}']['${item.exported ? item.exported : item.name}'] = window.modulesMap['${item.source}']['${item.name}'];\n`;
            } else {
              // * 的情况
              if (item.exported) {
                return `window.modulesMap['${fileName}']['${item.exported}'] = window.modulesMap['${item.source}'];\n`;
              } else {
                return `Object.assign(window.modulesMap['${fileName}'], window.modulesMap['${item.source}']);\n`;
              }
            }
          })
          .join('')}
        ${moduleContent}
        ${exports
          .filter((item) => !item.source)
          .map((item) => {
            return `window.modulesMap['${fileName}']['${item.exported ? item.exported : item.name}'] = ${item.name};\n`;
          })
          .join('')}
    })()
      `;
    eval(functionString);
  }

  async handleStringToComponent(
    componentString: string,
    name: string,
    preDefinitionScriptContext?: string,
  ): Promise<any> {
    throw new Error('handleStringToComponent应该被注册!');
  }

  async handleDisposeImportReactComponent(fileName: string): Promise<string> {
    if (ParseStringToComponent._parseLanguage === 'react')
      throw new Error('handleDisposeImportReactComponent应该注册!');
    else return '';
  }

  async handleDisposeImportVueComponent(fileName: string, name: string) {
    if (ParseStringToComponent._parseLanguage === 'vue')
      throw new Error('handleDisposeImportVueComponent应该注册!');
  }

  async handleDisposeImportJsPackage(importStatement: string) {
    const importContent = await this.parseImportContent(importStatement);
    return importContent;
  }

  async handleDisposeCss(importStatement: string): Promise<string> {
    return '';
  }

  async parseToComponent(componentString: string, name: string) {
    const importRegex = /import\s+[^'"]*['"][^'"]+['"];?/g;
    const allImports = componentString.match(importRegex) || [];

    // 过滤外部包
    const filterImports = allImports.filter(
      (importStatement: any) =>
        !importStatement.includes(
          `'${ParseStringToComponent.parseLanguage}'`,
        ) &&
        !importStatement.includes(`"${ParseStringToComponent.parseLanguage}"`),
    );

    // 检查合法性
    for (let i = 0; i < filterImports.length; i++) {
      const fileName = CommonParseTools.getImportStatementFileName(
        filterImports[i],
      );
      await this._legalStringCheck!.checkIsLegalPackage(fileName);
    }

    let preDefinitionContext = '';
    let preDefinitionScriptContext = '';
    for (let i = 0; i < filterImports.length; i++) {
      componentString = componentString.replace(filterImports[i], '');
      const ast = acorn.parse(filterImports[i], {
        sourceType: 'module',
        ecmaVersion: 'latest',
      });
      if (
        (ast.body[0] as any).source.value?.endsWith('.tsx') ||
        (ast.body[0] as any).source.value?.endsWith('.jsx')
      ) {
        const fileName = (ast.body[0] as any).source.value;
        preDefinitionContext +=
          await this.handleDisposeImportReactComponent(fileName);
        continue;
      }

      if ((ast.body[0] as any).source.value?.endsWith('.vue')) {
        const fileName = (ast.body[0] as any).source.value;
        const name = (ast.body[0] as any).specifiers[0].local.name;
        await this.handleDisposeImportVueComponent(fileName, name);
        continue;
      }

      if (
        (ast.body[0] as any).source.value?.endsWith('.ts') ||
        (ast.body[0] as any).source.value?.endsWith('.js')
      ) {
        const temp = await this.handleDisposeImportJsPackage(filterImports[i]);
        preDefinitionContext += temp;
        preDefinitionScriptContext += temp;
      }

      if (
        (ast.body[0] as any).source.value?.endsWith('.css') ||
        (ast.body[0] as any).source.value?.endsWith('.less') ||
        (ast.body[0] as any).source.value?.endsWith('.scss') ||
        (ast.body[0] as any).source.value?.endsWith('.sass')
      ) {
        preDefinitionContext += await this.handleDisposeCss(filterImports[i]);
      }
    }

    componentString = preDefinitionContext + componentString;

    return await this.handleStringToComponent(
      componentString,
      name,
      preDefinitionScriptContext,
    );
  }
}
