import {
  ChartTypes,
  ItemSingle,
  SiteTheme,
  VALUE_TYPE, WidgetCustomField,
  WidgetItem,
  WidgetParams,
  WidgetSize
} from './widget.interface';
import {WidgetApi} from './widget.api';

export const _ = (str: string) => str;

export class WidgetComponent {

  API: WidgetApi;
  media: any;
  width: number;
  height: number;

  container: Element;

  onInit(container: Element) {
    this.container = container;
  }

  onDestroy() {
  }

  onResize(width, height) {
    this.width = width;
    this.height = height;
  }

  onRender(values) {

  }

  onUpdate(values) {
  }

}


export class WidgetComponentContainer {

  values: any;
  pictureId: number;
  theme: SiteTheme;

  readonly CHART_TYPES = ChartTypes;
  readonly VALUE_TYPE = VALUE_TYPE;


  urlExport(): string {
    return '';
  }

  paramCancel(par: WidgetItem) {
  }

  paramEdit(par: WidgetItem) {
  }

  paramSave(par: WidgetItem) {
  }

  getIconUrl(par: WidgetItem): string {
    return '';
  }

  setManual(par: WidgetItem, value) {

  }
}


export interface WidgetPackage {
  template: string;
  component: WidgetComponent;
  params: WidgetParams;
  size: WidgetSize;
  styles: string;
  locales?: { code: string, file: string }[];
  needPicture?: boolean;
  fields?: WidgetCustomField[];
}

