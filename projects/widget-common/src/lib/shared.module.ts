import {TranslateModule} from '@ngx-translate/core';
import {NgModule} from '@angular/core';
import {NvD3Module} from 'ng2-nvd3';
import {ChartComponentModule} from './chart/chart.component';
import {ArrayNumberPipe, ChartUrl, FilterIndexOfPipe, MakeChartUrl, MakeIconUrl, MakePictureUrl, PeriodFromDatePipe} from './widget.utils';
import {InlineSVGModule} from 'ng-inline-svg';
import {ForgeComponentModule} from './forge/forge.component';
import {EChartComponentModule} from './echart/echart.component';

@NgModule({
  declarations: [
    PeriodFromDatePipe,
    FilterIndexOfPipe,
    ArrayNumberPipe,
    MakePictureUrl,
    MakeIconUrl,
    MakeChartUrl,
    ChartUrl,
  ],
  imports: [
    TranslateModule,
    NvD3Module,
    ChartComponentModule,
    EChartComponentModule,
    ForgeComponentModule,
    InlineSVGModule.forRoot({ baseUrl: '' }),
  ],
  exports: [
    TranslateModule,
    NvD3Module,
    PeriodFromDatePipe,
    FilterIndexOfPipe,
    ArrayNumberPipe,
    MakePictureUrl,
    MakeIconUrl,
    MakeChartUrl,
    ChartUrl,
    ChartComponentModule,
    EChartComponentModule,
    ForgeComponentModule,
    InlineSVGModule,
  ]
})
export class DashboardSharedModule {
}

