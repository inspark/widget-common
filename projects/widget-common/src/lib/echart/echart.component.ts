import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  LOCALE_ID,
  NgModule,
  OnChanges,
  OnDestroy,
  OnInit
} from '@angular/core';
import {ChartTypes, ItemSeries, ParamConfigSeries, SeriesDuration, SeriesLineValue, SiteTheme} from '../widget.interface';
import {CommonModule, DatePipe} from '@angular/common';
import {NgxEchartsModule} from 'ngx-echarts';
import {EChartsOption, SeriesOption} from 'echarts/types/dist/echarts';
import * as echarts from 'echarts';
import {PieChartComponent} from '../pie-chart/pie-chart.component';
import langRU from 'echarts/lib/i18n/langRU';

echarts.registerLocale('RU', langRU);

const GRADIENT = [
  new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    {
      offset: 0,
      color: 'rgb(128, 255, 165)'
    },
    {
      offset: 1,
      color: 'rgb(1, 191, 236)'
    }
  ]),
  new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    {
      offset: 0,
      color: 'rgb(0, 221, 255)'
    },
    {
      offset: 1,
      color: 'rgb(77, 119, 255)'
    }
  ]),
  new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    {
      offset: 0,
      color: 'rgb(55, 162, 255)'
    },
    {
      offset: 1,
      color: 'rgb(116, 21, 219)'
    }
  ]),
  new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    {
      offset: 0,
      color: 'rgb(255, 0, 135)'
    },
    {
      offset: 1,
      color: 'rgb(135, 0, 157)'
    }
  ]),
  new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    {
      offset: 0,
      color: 'rgb(255, 191, 0)'
    },
    {
      offset: 1,
      color: 'rgb(224, 62, 76)'
    }
  ])
];

const getGradient = (seed) => {
  return GRADIENT[seed % GRADIENT.length];
};


@Component({
  selector: 'app-echart',
  templateUrl: './echart.component.html',
  styleUrls: ['./echart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EchartComponent implements OnInit, OnChanges, OnDestroy {


  @Input() values: ItemSeries[];
  @Input() config: ParamConfigSeries;
  @Input() locale = 'en';
  @Input() noDataMessage = 'No data';
  @Input() width = 250;
  @Input() height = 250;
  @Input() margin = {
    top: 40,
    right: 40,
    bottom: 40,
    left: 40
  };
  @Input() theme: SiteTheme;

  data = [];
  options: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      className: 'label-formatter',
      formatter: (params, ticket) => {
        console.log('params', params, ticket);

        let res = 'No data';
        if (params[0]) {
          res = `<div class="title">${new DatePipe(this.getLocale(this.locale)).transform(params[0].value[0], 'd MMM y, HH:mm:ss')}</div><table>`;
          res += params.map(val => {
            return `<tr><td class="label">${val.marker} ${val.seriesName}</td><td class="value">${val.value[1]}</td></tr>`;
          }).join('') + '</table>';

        }
        return res;
      }
    },
    xAxis: {
      type: 'time',
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
    },
    toolbox: {
      feature: {
        magicType: {
          type: ['line', 'bar', 'stack']
        },
        mark: {show: true},
        dataView: {show: true, readOnly: false},
        restore: {show: true},
        saveAsImage: {show: true}
      }
    },
    grid: {
      left: `${this.margin.left}px`,
      right: `${this.margin.right}px`,
      bottom: `${this.margin.bottom}px`,
      top: `${this.margin.top}px`,
      containLabel: true
    },
    series: [],
  };

  uniqTitles = [];

  initOpts: any = {
    locale: this.locale.toLocaleUpperCase()
  };

  darkColor = [
    {'color': '#00FF7F'},
    {'color': '#00E0E0'},
    {'color': '#FF00FF'},
    {'color': '#B2CCE5'},
    {'color': '#F1F227'},
    {'color': '#FDE3A7'},
    {'color': '#F64747'},
    {'color': '#8BB82D'},
    {'color': '#1E90FF'},
    {'color': '#D2527F'},
    {'color': '#91A6BA'}];

  lightColor = [
    {'color': '#007A4B'},
    {'color': '#3477DB'},
    {'color': '#D252B2'},
    {'color': '#708090'},
    {'color': '#AF851A'},
    {'color': '#BB671C'},
    {'color': '#E00000'},
    {'color': '#005031'},
    {'color': '#34415E'},
    {'color': '#58007E'},
    {'color': '#2E343B'}
  ];


  display = true;


  echartsInstance: any;

  constructor(private cdr: ChangeDetectorRef) {


  }

  ngOnChanges(changes) {
    if (changes.locale) {
      this.initOpts = {locale: this.locale};
      this.display = false;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.display = true;
        this.cdr.detectChanges();
      });
    }
    if (this.echartsInstance && (changes.width || changes.height)) {
      this.resizeChart();
    }
    if (changes.config || changes.values) {
      this.data = [];
      if (this.config && this.values) {
        if (this.values.length && this.values[0].data) {
          this.updateData(this.config, this.values);
        }
      }
    }
  }

  ngOnInit() {
    this.initOpts = {locale: this.locale};
  }

  ngOnDestroy() {
  }

  onChartInit(ec) {
    this.echartsInstance = ec;
  }

  getLocale(locale) {
    return locale.toLowerCase() === 'ru' ? 'ru-RU' : 'en-US';
  }

  resizeChart() {
    if (this.echartsInstance) {
      this.echartsInstance.resize();
    }
  }

  updateData(config: ParamConfigSeries, values: ItemSeries[]) {

    const res: SeriesOption[] = [];
    const legend: string[] = [];
    const xAxis: any = {
      type: 'time',
      boundaryGap: false,
    };
    this.uniqTitles = [];

    const value = values[0];
    const times = this.getMaxMinTimeline(value);
    let period;
    switch (config.duration) {
      case SeriesDuration.day:
        // zoom.scaleExtent = [1, 6];
        period = this.getDay(config.count, value.device.object.timezone);
        break;
      case SeriesDuration.month:
        period = this.getMonth(config.count, value.device.object.timezone);
        // zoom.scaleExtent = [1, 192];
        break;
      case SeriesDuration.week:
        // zoom.scaleExtent = [1, 48];
        period = this.getWeek(config.count, value.device.object.timezone);
        break;
      default:
        period = this.getDate();
    }

    if (config.generator) {
      const times = this.getMaxMinTimeline(value);
      xAxis.min = times.min;
      xAxis.max = times.max;
    } else {
      xAxis.min = period.startTime;
      xAxis.max = period.endTime;
    }


    if (config.charttype === ChartTypes.histogramChart) {

      values.forEach((value, ind) => {

        const title = this.findUniqName(value.title);
        legend.push(title);
        res.push({
          type: 'bar',
          data: value.data.map((val: any) => {
            // return {x: val.timestmp, y: val.value};
            return [val.timestmp, val.value];
          }),
          itemStyle: {
            color: this.getChartColor(ind),
          },
          name: title,
        });
      });
    } else if (config.charttype === ChartTypes.candlestickBarChart) {
      values.forEach((value, ind) => {
        const title = this.findUniqName(value.title);
        legend.push(title);
        res.push({
          type: 'candlestick',
          data: value.data.map((val: any) => {
            // return {x: val.timestmp, y: val.value};
            return [val.timestmp, val.open, val.close, val.low, val.high];
          }),
          name: title,
        });
      });
    } else {
      values.forEach((value, ind) => {
        const title = this.findUniqName(value.title);
        legend.push(title);

        if (config.charttype === ChartTypes.stackedAreaChart) {
          res.push({
            type: 'line',
            stack: 'Total',
            smooth: true,
            name: title,
            data: value.data.map((val: any) => {
              // return {x: val.timestmp, y: val.value};
              return [val.timestmp, val.value];
            }),
            lineStyle: {
              width: 0
            },
            showSymbol: false,
            emphasis: {
              focus: 'series'
            },
            // itemStyle: {
            //   color: ({seriesIndex, dataIndex}) => this.getChartColor(seriesIndex),
            // },
            areaStyle: {
              opacity: 0.8,
              color: getGradient(ind)
            },
          });
        } else {
          res.push({
            type: 'line',
            smooth: true,
            name: title,
            lineStyle: {
              color: this.getChartColor(ind),
            },
            itemStyle: {
              color: this.getChartColor(ind),
            },
            data: value.data.map((val: any) => {
              // return {x: val.timestmp, y: val.value};
              return [val.timestmp, val.value];
            }),
          });
        }
      });
    }
    this.options = {...this.options, xAxis, legend: {data: legend, top: `${this.margin.top}px`}, series: res};
  }

  findUniqName(title, ind = 0) {

    if (ind === 0) {
      if (this.uniqTitles.indexOf(title) !== -1) {
        return this.findUniqName(title, ind + 1);
      }
      this.uniqTitles.push(title);
      return title;
    } else {
      const newTitle = `${title} (${ind})`;
      if (this.uniqTitles.indexOf(newTitle) !== -1) {
        return this.findUniqName(title, ind + 1);
      }
      this.uniqTitles.push(newTitle);
      return newTitle;
    }
  }

  // generateChartOptions(config: ParamConfigSeries, values: ItemSeries[]) {
  //   const value = values[0];
  //   let res: EChartsOption = {};
  //   const zoom = {
  //     'enabled': true,
  //     'scaleExtent': [
  //       1, 48
  //     ],
  //     'useFixedDomain': false,
  //     'useNiceScale': false,
  //     'horizontalOff': false,
  //     'verticalOff': true,
  //     'unzoomEventType': 'dblclick.zoom'
  //   };
  //
  //
  //   let period;
  //   let xDomain = [];
  //   let yDomain;
  //   const chartdatamin = [];
  //   const chartdatamax = [];
  //
  //   if (value.device.param.type === PARAM_TYPE.signal) {
  //     chartdatamax[0] = 1.2;
  //     chartdatamin[0] = -0.2;
  //   } else {
  //     const maxmin = this.getMaxMin(values);
  //     chartdatamax[0] = maxmin.max;
  //     chartdatamin[0] = maxmin.min;
  //     if (chartdatamax[0] === chartdatamin[0]) {
  //       chartdatamax[0] += 10;
  //     }
  //   }
  //
  //   if ([ChartTypes.lineChart, ChartTypes.histogramChart, ChartTypes.stackedAreaChart].indexOf(config.charttype) !== -1) {
  //
  //     if (config.charttype !== ChartTypes.stackedAreaChart) {
  //       const delta: any = (chartdatamax[0] - chartdatamin[0]) / 10;
  //       yDomain = [chartdatamin[0] - delta, chartdatamax[0] + delta];
  //     }
  //
  //
  //   }
  //
  //   switch (config.duration) {
  //     case SeriesDuration.day:
  //       zoom.scaleExtent = [1, 6];
  //       period = this.getDay(config.count, value.device.object.timezone);
  //       break;
  //     case SeriesDuration.month:
  //       period = this.getMonth(config.count, value.device.object.timezone);
  //       zoom.scaleExtent = [1, 192];
  //       break;
  //     case SeriesDuration.week:
  //       zoom.scaleExtent = [1, 48];
  //       period = this.getWeek(config.count, value.device.object.timezone);
  //       break;
  //     default:
  //       period = this.getDate();
  //   }
  //
  //   if (config.generator) {
  //     const times = this.getMaxMinTimeline(value);
  //     xDomain = [times.min, times.max];
  //   } else {
  //     xDomain = [period.startTime, period.endTime];
  //   }
  //
  //   if (config.charttype === ChartTypes.histogramChart) {
  //
  //     res = {
  //       tooltip: {},
  //       height: this.height,
  //       margin: this.margin,
  //       clipEdge: true,
  //       duration: 300,
  //       useInteractiveGuideline: false,
  //       xAxis: {
  //         text: 'Дата',
  //         // showMaxMin: true,
  //         // axisLabelDistance: 5,
  //         tickFormat: (d) => {
  //           return this.tickMultiFormat(new Date(d));
  //         },
  //       },
  //       zoom,
  //       yAxis: {
  //         text: value.device.param.measure.title ? `${value.device.param.measure.title} [${value.device.param.measure.unit}]` : '',
  //         tickFormat: tickFormat,
  //         axisLabelDistance: 5
  //       },
  //     };
  //   } else {
  //
  //     res = {
  //       type: config.charttype,
  //       tooltip: {enabled: false},
  //       noData: this.noDataMessage,
  //       xScale: d3.time.scale(),
  //       showControls: true,
  //       height: this.height,
  //       margin: this.margin,
  //       x: function (d) {
  //         if (d) {
  //           return d.timestmp;
  //         } else {
  //           return 0;
  //         }
  //       },
  //       y: function (d) {
  //         if (!d) {
  //           return null;
  //         }
  //         return config.charttype === ChartTypes.candlestickBarChart ? d.close : d.value;
  //       },
  //       useVoronoi: true,
  //       clipEdge: false,
  //       duration: 300,
  //       useInteractiveGuideline: false,
  //       xAxis: {
  //         axisLabel: 'Дата',
  //         showMaxMin: false,
  //         tickFormat: (d) => {
  //           return this.tickMultiFormat(new Date(d));
  //         },
  //       },
  //       xDomain,
  //       yDomain,
  //       yAxis: {
  //         axisLabel: value.device.param.measure.title ? `${value.device.param.measure.title} [${value.device.param.measure.unit}]` : '',
  //         tickFormat: tickFormat,
  //         axisLabelDistance: 5
  //       },
  //       zoom,
  //     };
  //   }
  //
  //   function tickFormat(d) {
  //     if (d == null) {
  //       return null;
  //       // return -10000000;
  //     }
  //     if (d > 9999) {
  //       return d3.format(',.1e')(d);
  //     } else if (d > 999) {
  //       return d3.format('f')(d);
  //     } else if (d > 99) {
  //       return d3.format('.2f')(d);
  //     }
  //     return d3.format('.02f')(d);
  //   }
  //
  //   return res;
  // }

  getMaxMin(values: ItemSeries[]) {
    let max = Number.MIN_VALUE, min = Number.MAX_VALUE;
    values.forEach(value => {
      value.data.forEach((val: SeriesLineValue) => {
        if (val.value > max) {
          max = val.value;
        }
        if (val.value < min) {
          min = val.value;
        }
      });
    });
    return {max, min};
  }

  getMaxMinTimeline(values: ItemSeries) {
    let max = Number.MIN_VALUE, min = Number.MAX_VALUE;
    if (values.data) {
      values.data.forEach((val: SeriesLineValue) => {
        if (val.timestmp > max) {
          max = val.timestmp;
        }
        if (val.timestmp < min) {
          min = val.timestmp;
        }
      });
    }
    return {max, min};
  }

  getDate() {
    const res: any = {};
    const d: any = new Date();
    const dd: any = d.getDate();
    const mm: any = d.getMonth() + 1;
    const yyyy: any = d.getFullYear();

    d.setSeconds(0);
    d.setMinutes(0);
    d.setHours(0);
    res.startTime = d.getTime();
    d.setSeconds(59);
    d.setMinutes(59);
    d.setHours(23);
    res.endTime = d.getTime();
    res.text = ('0' + dd).slice(-2) + '/' + ('0' + mm).slice(-2) + '/' + yyyy;
    return res;

  }

  getDay(num, timezone) {
    const res: any = {};
    const d: Date = new Date();
    d.setHours(0, 0, 0);
    d.setTime(d.getTime() + (-d.getTimezoneOffset() - timezone * 60) * 60000); // set object timezone
    d.setDate(d.getDate() - num);
    res.startTime = d.getTime();
    d.setDate(d.getDate() + 1);
    res.endTime = d.getTime();
    return res;
  }


  getWeek(num, timezone) {
    const res: any = {};
    const d: Date = new Date();
    const day = d.getDay();
    if (day === 0) {
      num++;
    }
    const firstDay = new Date();
    const lastDay = new Date();
    if (num === 0) { // Если сдвиг 0, то неделя отсчитывается от текущего дня
      firstDay.setDate(d.getDate() - num * 7 + 1 - 7);
    } else {
      firstDay.setDate(d.getDate() - day - num * 7 + 1);
    }
    firstDay.setHours(0, 0, 0);
    firstDay.setTime(firstDay.getTime() + (-firstDay.getTimezoneOffset() - timezone * 60) * 60000); // set object timezone
    lastDay.setTime(firstDay.getTime() + 7 * 24 * 60 * 60 * 1000);

    res.startTime = firstDay.getTime();
    res.endTime = lastDay.getTime();
    res.text = ('0' + firstDay.getDate()).slice(-2) + '/' + ('0' + (firstDay.getMonth() + 1)).slice(-2) + '/' + firstDay.getFullYear() +
      ' - ' +
      ('0' + lastDay.getDate()).slice(-2) + '/' + ('0' + (lastDay.getMonth() + 1)).slice(-2) + '/' + lastDay.getFullYear();

    return res;
  }


  getMonth(num, timezone) {
    const res: any = {};
    const d: Date = new Date();
    d.setHours(0, 0, 0);
    d.setDate(1);
    d.setMonth(d.getMonth() - num);
    d.setTime(d.getTime() + (-d.getTimezoneOffset() - timezone * 60) * 60000); // set object timezone
    const firstDay = d;
    res.startTime = d.getTime();
    d.setMonth(d.getMonth() + 1);
    res.endTime = d.getTime();
    const lastDay = d;
    res.text = ('0' + firstDay.getDate()).slice(-2) + '/' + ('0' + (firstDay.getMonth() + 1)).slice(-2) + '/' + firstDay.getFullYear() +
      ' - ' + ('0' + lastDay.getDate()).slice(-2) + '/' + ('0' + (lastDay.getMonth() + 1)).slice(-2) + '/' + lastDay.getFullYear();
    return res;
  }

  getChartColor(seed) {
    if (this.theme === SiteTheme.dark) {
      return this.darkColor[seed % this.darkColor.length].color;
    } else {
      return this.lightColor[seed % this.lightColor.length].color;
    }

  }
}


@NgModule({
  declarations: [
    EchartComponent,
    PieChartComponent,
  ],
  imports: [
    CommonModule,
    NgxEchartsModule
  ],
  exports: [
    EchartComponent,
    PieChartComponent,
  ],
  providers: [
    {provide: LOCALE_ID, useValue: 'en-US'},
    {provide: LOCALE_ID, useValue: 'ru-RU'},
  ],
  entryComponents: [EchartComponent, PieChartComponent]
})
export class EChartComponentModule {
}
