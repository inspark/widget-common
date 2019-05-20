import {SiteTheme, WidgetParams, WidgetSize} from './widget.interface';

export const _ = (str: string) => str;

export class WidgetComponent {

  values: any;
  media: any;
  theme: SiteTheme;

  onInit() {


  }

  onDestroy() {

  }

  onUpdate(values) {

  }

}


export interface WidgetPackage {
  template: string;
  component: WidgetComponent;
  params: WidgetParams;
  size: WidgetSize;
  styles: string;
  locales?: { code: string, file: string }[];
  needPicture?: boolean
}

