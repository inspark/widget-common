import {Injectable} from '@angular/core';

declare var document: any;

const ScriptStore: any[] = [
  {name: 'viewer', src: 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js'},
];
const StyleStore: any[] = [
  {name: 'viewer', src: 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css'},
];

let promiseLoad: any = null;
let isLoadedStyles = false;


@Injectable()
export class ScriptService {

  private scripts: any = {};
  private styles: any = {};

  constructor() {
    ScriptStore.forEach((script: any) => {
      this.scripts[script.name] = {
        loaded: false,
        src: script.src
      };
    });
  }

  loadStyles() {

    if (!isLoadedStyles) {
      isLoadedStyles = true;
      StyleStore.forEach(style => {
        const el = document.createElement('link');
        el.rel = 'stylesheet';
        el.href = style.src;
        el.type = 'text/css';
        document.getElementsByTagName('head')[0].appendChild(el);
      });
    }
  }

  load(...scripts: string[]) {
    if (!promiseLoad) {
      promiseLoad = new Promise((resolve, reject) => {
        const promises: any[] = [];
        scripts.forEach((script) => promises.push(this.loadScript(script)));
        Promise.all(promises).then(data => {
          resolve(data);
        });
      });
    }
    return promiseLoad;
  }

  loadScript(name: string) {
    return new Promise((resolve, reject) => {
      if (this.scripts[name].loaded) {
        resolve({script: name, loaded: true, status: 'Already Loaded'});
      } else {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = this.scripts[name].src;
        if (script.readyState) {  // IE
          script.onreadystatechange = () => {
            if (script.readyState === 'loaded' || script.readyState === 'complete') {
              script.onreadystatechange = null;
              this.scripts[name].loaded = true;
              resolve({script: name, loaded: true, status: 'Loaded'});
            }
          };
        } else {  // Others
          script.onload = () => {
            this.scripts[name].loaded = true;
            resolve({script: name, loaded: true, status: 'Loaded'});
          };
        }
        script.onerror = (error: any) => resolve({script: name, loaded: false, status: 'Loaded'});
        document.getElementsByTagName('head')[0].appendChild(script);
      }
    });
  }

}
