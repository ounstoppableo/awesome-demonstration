import { getFileContent, parseCssToObject } from '@/app/lib/data';
import ParseStringToComponent, {
  CommonParseTools,
} from './parseStringToComponent';
//@ts-ignore
import * as Babel from '@babel/standalone';
import React from 'react';
import { ComponentInfoForViewerType } from '../addComponentFormDataFormat';
//@ts-ignore
import { compileString } from 'sass';
//@ts-ignore
import less from 'less';

export function Register(target: typeof ParseStringToComponent) {
  class RegisteredParseStringComponent extends target {
    static _legalExtension = [
      '.ts',
      '.tsx',
      'jsx',
      'js',
      'scss',
      'sass',
      'less',
      'css',
    ];
    static _parseLanguage = 'react';
    static handleInstallDependence(): void {
      if (typeof window !== 'undefined') {
        (window as any).React = null;
        (window as any).React = React;
      }
    }
    constructor(componentInfo: ComponentInfoForViewerType) {
      target._legalExtension = RegisteredParseStringComponent._legalExtension;
      target._parseLanguage = RegisteredParseStringComponent._parseLanguage;

      RegisteredParseStringComponent.handleInstallDependence();
      super(componentInfo);
    }
    async handleGetFileContent(fileName: string): Promise<any> {
      if (this.componentInfo.fileContentsMap[fileName]) {
        return this.componentInfo.fileContentsMap[fileName];
      } else {
        const fileContent = (
          await getFileContent({ id: this.componentInfo.id, fileName })
        ).data.fileContent;
        return fileContent;
      }
    }
    async handleDisposeImportReactComponent(fileName: string): Promise<string> {
      const fileContent = await this.handleGetFileContent(fileName);
      const components = await this.parseToComponent(fileContent, fileName);
      return `
      ${Object.keys(components).map((component: any) => {
        return `
            const ${component} = ${components[component]}
        `;
      })}
      `;
    }
    async handleStringToComponent(componentString: string, name: string) {
      componentString = Babel.transform(
        CommonParseTools.clearExportKeyWords(
          CommonParseTools.tsxTransJsx(componentString),
        ),
        {
          presets: ['react'],
        },
      ).code;

      componentString = CommonParseTools.clearImportKeyWords(componentString);
      const components = CommonParseTools.getFunctionAndReturn(componentString)
        .filter((item: any) => item.returnValue === '<component>')
        .map((item: any) => item.functionName);

      componentString += `
      if(!window._components['${name}']) window._components['${name}'] = {};
            ${components
              .map((component: any) => {
                return `
              window._components['${name}']['${component}'] = ${component};
              `;
              })
              .join(';')}`;

      eval(`(function(React, useState, useEffect,useRef,useActionState,useCallback,useContext,useDebugValue,useDeferredValue,useId,useImperativeHandle,useInsertionEffect,useLayoutEffect,useMemo,useOptimistic,useReducer,useSyncExternalStore,useTransition) {
        ${componentString}
      })(React,React.useState, React.useEffect,React.useRef,React.useActionState,React.useCallback,React.useContext,React.useDebugValue,React.useDeferredValue,React.useId,React.useImperativeHandle,React.useInsertionEffect,React.useLayoutEffect,React.useMemo,React.useOptimistic,React.useReducer,React.useSyncExternalStore,React.useTransition)`);

      const result: any = {};

      components.forEach((component: any) => {
        result[component] = (window as any)._components[name][component];
      });

      return result;
    }
    async handleDisposeCss(importStatement: string): Promise<string> {
      const fileName =
        CommonParseTools.getImportStatementFileName(importStatement);
      let fileContent = await this.handleGetFileContent(fileName);
      if (fileName.endsWith('.scss') || fileName.endsWith('.sass')) {
        fileContent = (await compileString(fileContent)).css;
      }
      if (fileName.endsWith('less')) {
        fileContent = (await less.render(fileContent)).css;
      }
      if (!fileName.includes('.module.')) {
        document.getElementById('reactGlobalCss' + fileName)?.remove();
        const styleDom = document.createElement('style');
        styleDom.id = 'reactGlobalCss' + fileName;
        styleDom.innerHTML = fileContent;
        document.head.append(styleDom);
      } else {
        try {
          const res = await parseCssToObject({
            fileContent,
          });
          if (res.code !== 200) return '';
          document.getElementById('reactModuleCss' + fileName)?.remove();
          const styleDom = document.createElement('style');
          styleDom.id = 'reactModuleCss' + fileName;
          styleDom.innerHTML = res.data.css;
          document.head.append(styleDom);
          const imports =
            CommonParseTools.getImportVariableFromContent(importStatement);
          const variable = imports[0].local;

          return `
            const ${variable} = ${JSON.stringify(res.data.map)}
          `;
        } catch (err) {}
      }
      return '';
    }
  }

  return RegisteredParseStringComponent;
}
