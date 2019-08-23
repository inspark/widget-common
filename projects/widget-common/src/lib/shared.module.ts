import {TranslateModule} from '@ngx-translate/core';
import {Injectable, NgModule} from '@angular/core';
import {NvD3Module} from 'angular2-nvd3';
import {ChartComponentModule} from './chart/chart.component';
import {
  ArrayNumberPipe,
  FilterIndexOfPipe,
  MakeChartUrl,
  MakeIconUrl,
  MakePictureUrl,
  PeriodFromDatePipe
} from './widget.utils';
import {InlineSVGModule} from 'ng-inline-svg';

@NgModule({
  declarations: [
    PeriodFromDatePipe,
    FilterIndexOfPipe,
    ArrayNumberPipe,
    MakePictureUrl,
    MakeIconUrl,
    MakeChartUrl,
  ],
  imports: [
    TranslateModule,
    NvD3Module,
    ChartComponentModule,
    InlineSVGModule.forRoot()
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
    ChartComponentModule,
    InlineSVGModule
  ]
})
export class DashboardSharedModule {
}

