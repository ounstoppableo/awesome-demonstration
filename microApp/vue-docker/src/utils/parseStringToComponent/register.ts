import ParseStringToComponent, {
  CommonParseTools,
} from './parseStringToComponent';
//@ts-ignore
import { useViewInfoStoreStore } from '@/store/viewInfoStore';
import * as Vue from 'vue';
//@ts-ignore
import { loadModule } from 'vue3-sfc-loader';
import parseStyleTag from '../extractStyle';
//@ts-ignore
import { compileString } from 'sass';
//@ts-ignore
import less from 'less';

export function Register(target: typeof ParseStringToComponent, _: any) {
  class RegisteredParseStringComponent extends target {
    static _legalExtension = ['.ts', 'js', 'vue'];
    static _parseLanguage = 'vue';
    _store: any = null;
    _app: any = null;
    constructor(rootApp: any) {
      target._legalExtension = RegisteredParseStringComponent._legalExtension;
      target._parseLanguage = RegisteredParseStringComponent._parseLanguage;
      const viewInfoStoreStore = useViewInfoStoreStore();
      super(viewInfoStoreStore.$state);
      this._store = viewInfoStoreStore;
      this._app = rootApp;
    }
    async handleGetFileContent(fileName: string): Promise<any> {
      return this._store.getFileContent(fileName);
    }
    async handleDisposeImportVueComponent(fileName: string, name: string) {
      const sfcString = await this._store.getFileContent(fileName);
      this.parseToComponent(sfcString, name);
    }
    async handleStringToComponent(
      componentString: string,
      name: string,
      preDefinitionScriptContext: string,
    ) {
      const lang = componentString.match(
        /<script[^>]*lang=['"](\w+)['"][^>]*>/,
      )?.[1];
      preDefinitionScriptContext =
        `<script lang="${lang ? lang : 'js'}">` +
        preDefinitionScriptContext +
        '</script>';
      const options = {
        moduleCache: { vue: Vue },
        async getFile(url?: any) {
          const rawStyle = parseStyleTag(componentString);
          let styleString = '<style scoped>';
          document
            .querySelectorAll(`[id^="${'style' + name}"]`)
            .forEach((item) => item.remove());
          for (let i = 0; i < rawStyle.length; i++) {
            document.getElementById('style' + name + i)?.remove();
            if (rawStyle[i].scoped === true) {
              if (rawStyle[i].lang === 'scss' || rawStyle[i].lang === 'sass') {
                styleString += (await compileString(rawStyle[i].content)).css;
              }
              if (rawStyle[i].lang === 'less') {
                styleString += (await less.render(rawStyle[i].content)).css;
              }
              if (rawStyle[i].lang === 'css') {
                styleString += rawStyle[i].content;
              }
            } else {
              const styleDom = document.createElement('style');
              styleDom.id = 'style' + name + i;
              styleDom.innerHTML = rawStyle[i].content;
              document.head.append(styleDom);
            }
          }
          styleString += '</style>';
          return Promise.resolve(
            preDefinitionScriptContext +
              componentString.replace(
                /<style\b[^>]*>([\s\S]*?)<\/style>/gi,
                '',
              ) +
              styleString,
          );
        },
        addStyle(styleString: any) {
          let style = document.getElementById(name);
          if (!style) {
            style = document.createElement('style');
            style.setAttribute('id', name);
            const ref = document.head.getElementsByTagName('style')[0] || null;
            document.head.insertBefore(style, ref);
          }
          style.textContent = styleString;
        },
      };
      const component = await loadModule(`${name}.vue`, options);
      this._app.component(name, component);
    }
  }

  return RegisteredParseStringComponent;
}
