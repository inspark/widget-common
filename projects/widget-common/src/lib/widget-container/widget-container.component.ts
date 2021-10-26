import {ItemSingle, IWidget, IWidgetClass, IWidgetParam, SiteTheme} from '../widget.interface';
import {WidgetPackage} from '../widget.component';

export interface WidgetContainerDevOptions {
  widgetPackage: WidgetPackage;
  setManual: (param: ItemSingle, value: boolean) => {};
  isDev: boolean;
  theme: SiteTheme;
  element: Element;
}


export interface WidgetContainerProduction {
  widget: IWidget;
  widgetPackage: WidgetPackage;
  widgetClass: IWidgetClass;
  params: IWidgetParam[];
  sendData: (param: ItemSingle) => {};
  setManual: (param: ItemSingle, value: boolean) => {};
  isDev: boolean;
  theme: SiteTheme;
  element: Element;
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
