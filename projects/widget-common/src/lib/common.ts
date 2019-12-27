import {IWidgetClass} from "./widget.interface";

class Common {

  serviceUrl = '';

  getWidgetPath(widget: IWidgetClass): string {
    return `/assets/widgets/${widget.storeId}/`;
  }

  transformChartUrlConfig(param: any, isCalc = null, isSignal = null): string {
    return '';
  }

  override(serviceUrl: string, transformChartUrlConfig: any, getWidgetPath: any) {
    this.serviceUrl = serviceUrl;
    this.transformChartUrlConfig = transformChartUrlConfig;
    this.getWidgetPath = getWidgetPath;
  }

}

export const common = new Common();
