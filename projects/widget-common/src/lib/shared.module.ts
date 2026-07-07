import {TranslateModule} from '@ngx-translate/core';
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ArrayNumberPipe, ChartUrl, FilterIndexOfPipe, MakeChartUrl, MakeIconUrl, MakePictureUrl, PeriodFromDatePipe} from './widget.utils';
import {InlineSVGModule} from 'ng-inline-svg-2';
import {ForgeComponentModule} from './forge/forge.component';
import {EChartComponentModule} from './echart/echart.component';
import {NgxEchartsModule} from 'ngx-echarts';

// PrimeNG
import {ButtonModule} from 'primeng/button';
import {DialogModule} from 'primeng/dialog';
import {ToastModule} from 'primeng/toast';
import {MessageService} from 'primeng/api';

export const PRIME_MODULES = [
  ButtonModule,
  DialogModule,
  ToastModule,
];

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    EChartComponentModule,
    ForgeComponentModule,
    InlineSVGModule.forRoot({baseUrl: ''}),
    NgxEchartsModule.forRoot({echarts: () => import('echarts')}),
    ...PRIME_MODULES,
    // Standalone pipes
    ArrayNumberPipe,
    FilterIndexOfPipe,
    MakePictureUrl,
    MakeIconUrl,
    MakeChartUrl,
    ChartUrl,
    PeriodFromDatePipe,
  ],
  exports: [
    CommonModule,
    TranslateModule,
    EChartComponentModule,
    ForgeComponentModule,
    InlineSVGModule,
    NgxEchartsModule,
    ...PRIME_MODULES,
    ArrayNumberPipe,
    FilterIndexOfPipe,
    MakePictureUrl,
    MakeIconUrl,
    MakeChartUrl,
    ChartUrl,
    PeriodFromDatePipe,
  ],
  providers: [
    MessageService,
  ],
})
export class DashboardSharedModule {}
