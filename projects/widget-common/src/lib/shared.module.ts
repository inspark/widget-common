import {TranslateModule} from '@ngx-translate/core';
import {NgModule} from '@angular/core';
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
    EChartComponentModule,
    ForgeComponentModule,
    InlineSVGModule.forRoot({ baseUrl: '' }),
  ],
  exports: [
    TranslateModule,
    PeriodFromDatePipe,
    FilterIndexOfPipe,
    ArrayNumberPipe,
    MakePictureUrl,
    MakeIconUrl,
    MakeChartUrl,
    ChartUrl,
    EChartComponentModule,
    ForgeComponentModule,
    InlineSVGModule,
  ]
})
export class DashboardSharedModule {
}

