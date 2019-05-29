class Common {

  serviceUrl = '';


  transformChartUrlConfig(id: number, isCalc, isSignal = false): string {
    return '';
  }

  override(serviceUrl: string, transformChartUrlConfig: any) {
    this.serviceUrl = serviceUrl;
    this.transformChartUrlConfig = transformChartUrlConfig;
  }

}

export const common = new Common();
