class Common {

  serviceUrl = '';


  transformChartUrlConfig(param: any, isCalc = null, isSignal = null): string {
    return '';
  }

  override(serviceUrl: string, transformChartUrlConfig: any) {
    this.serviceUrl = serviceUrl;
    this.transformChartUrlConfig = transformChartUrlConfig;
  }

}

export const common = new Common();
