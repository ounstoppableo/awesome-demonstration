import ParseStringToComponent, {
  CommonParseTools,
} from './parseStringToComponent';
//@ts-ignore
import { useViewInfoStoreStore } from '@/store/viewInfoStore';
import * as Vue from 'vue';
//@ts-ignore
import { loadModule } from 'vue3-sfc-loader';
import extractStyledBlocks from '../extractStyle';
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
    async handleStringToComponent(componentString: string, name: string) {
      const options = {
        moduleCache: { vue: Vue },
        async getFile(url?: any) {
          const rawStyle = extractStyledBlocks(componentString);
          let styleString = '<style>';
          await Promise.all(
            rawStyle.map(async (style) => {
              if (style.lang === 'scss' || style.lang === 'sass') {
                styleString += (await compileString(style.content)).css;
              }
              if (style.lang === 'less') {
                styleString += (await less.render(style.content)).css;
              }
            }),
          );
          styleString += '</style>';
          return Promise.resolve(
            componentString.replace(
              /<style[^>]*lang=["'](scss|sass|less)["'][^>]*>([\s\S]*?)<\/style>/g,
              '',
            ) + styleString,
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
