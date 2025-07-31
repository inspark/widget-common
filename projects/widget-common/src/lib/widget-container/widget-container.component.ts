import {ItemSingle, IWidget, IWidgetClass, IWidgetParam, SiteTheme} from '../widget.interface';
import {WidgetPackage} from '../widget.component';

export interface WidgetContainerDevOptions {
  widget: IWidget;
  widgetPackage: WidgetPackage;
  setManual: (param: ItemSingle, value: boolean) => {};
  paramEdit: (param: ItemSingle, container?: HTMLElement) => {};
  isDev: boolean;
  theme: SiteTheme;
  element: Element;
  locale: string;
}


export interface WidgetContainerProduction {
  widget: IWidget;
  widgetClass: IWidgetClass;
  id: string;
  widgetPackage: WidgetPackage;
  sendData: (param: ItemSingle) => {};
  setManual: (param: ItemSingle, value: boolean) => {};
  paramEdit: (param: ItemSingle, container?: HTMLElement) => {};
  isDev: boolean;
  theme: SiteTheme;
  element: Element;
  locale: string;
}


export class WidgetContainer {


  /**
   * @deprecated
   * @param componentType
   */
  public createComponentModule(componentType: any): any {

    throw new Error('You should implement this method');
  }


  /**
   * @deprecated
   * @param opts
   */
  public createNewComponent(opts: WidgetContainerDevOptions | WidgetContainerProduction): any {

    throw new Error('You should implement this method');
  }

}
