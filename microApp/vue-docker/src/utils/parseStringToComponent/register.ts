import ParseStringToComponent, {
  commonParseTools,
} from './parseStringToComponent';
//@ts-ignore
import { useViewInfoStoreStore } from '@/store/viewInfoStore';
import * as Vue from 'vue';
//@ts-ignore
import { loadModule } from 'vue3-sfc-loader';

export function Register(target: typeof ParseStringToComponent, _: any) {
  class RegisteredParseStringComponent extends target {
    static _legalExtension = ['.ts', 'js', 'vue'];
    static _parseLanguage = 'vue';
    _store: any = null;
    constructor() {
      target._legalExtension = RegisteredParseStringComponent._legalExtension;
      target._parseLanguage = RegisteredParseStringComponent._parseLanguage;
      const viewInfoStoreStore = useViewInfoStoreStore();
      super(viewInfoStoreStore.$state);
      this._store = viewInfoStoreStore;
    }
    async handleGetFileContent(fileName: string): Promise<any> {
      return this._store.getFileContent(fileName);
    }
    async handleDisposeImportVueComponent(
      fileName: string,
      name: string,
      rootApp: any,
    ) {
      const sfcString = await this._store.getFileContent(fileName);
      this.parseToComponent(sfcString, name, rootApp);
    }
    async handleStringToComponent(
      componentString: string,
      name: string,
      rootApp: any,
    ) {
      const app: any = rootApp ? rootApp : Vue.inject('app');
      const options = {
        moduleCache: { vue: Vue },
        async getFile(url?: any) {
          return Promise.resolve(componentString);
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
      rootApp.component(name, component);
    }
  }

  return RegisteredParseStringComponent;
}
