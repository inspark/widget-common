import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  LOCALE_ID,
  NgModule,
  OnChanges,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  ChartTypes, ChartViews,
  ItemSeries,
  ParamConfigSeries,
  SeriesCandleValue,
  SeriesDuration,
  SeriesLineValue,
  SiteTheme
} from '../widget.interface';
import {CommonModule, DatePipe} from '@angular/common';
import {NgxEchartsModule} from 'ngx-echarts';
import {EChartsOption, SeriesOption} from 'echarts/types/dist/echarts';
import * as echarts from 'echarts';
import {PieChartComponent} from '../pie-chart/pie-chart.component';
import langRU from './ru';
import langEN from './en';

echarts.registerLocale('RU', langRU);
echarts.registerLocale('EN', langEN);

const FULL_DAY = 86400000;
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


const cutName = (name, length) => {
  if (name.length > length + 3) {
    return name.substr(0, length) + '...';
  }
  return name;
};

const BackGround = {
  [SiteTheme.light]: '#FFFFFF',
  [SiteTheme.dark]: '#494C55'
};

const RedZone = {
  [SiteTheme.light]: 'rgba(255, 173, 177, 0.4)',
  [SiteTheme.dark]: 'rgba(145, 30, 49, 0.2)'
};

export interface SimpleData {
  title?: string;
  data: number[];
}

@Component({
  selector: 'app-echart',
  templateUrl: './echart.component.html',
  styleUrls: ['./echart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.Emulated,
})
export class EchartComponent implements OnInit, OnChanges, OnDestroy {


  @Input() values: ItemSeries[];
  @Input() simpleData: SimpleData[];
  @Input() config: ParamConfigSeries;
  @Input() locale = 'en';
  @Input() noDataMessage = 'No data';
  @Input() width = 250;
  @Input() height = 250;
  @Input() margin = {
    top: 70,
    right: 20,
    bottom: 60,
    left: 20
  };
  @Input() theme: SiteTheme;

  data = [];
  options: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      appendToBody: true,
      // confine: true,
      renderMode: 'html',
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      className: 'label-formatter',
      formatter: (params, ticket) => {
        let res = 'No data';
        if (params[0]) {
          res = `<div class="title">${new DatePipe(this.getLocale(this.locale)).transform(params[0].value[0], 'd MMM y, HH:mm')}</div><table>`;
          res += params.map(val => {

            if (typeof val.value[val.value.length - 1] === 'number') {
              return `<tr><td class="label">${val.marker} ${cutName(val.seriesName, 20)}</td>
<td><div class="value"><b>${this.roundData(val.value[1])}</b> </div></td></tr>`;
            } else {

              const unit = val.value[val.value.length - 1].device.param.measure.unit ? val.value[val.value.length - 1].device.param.measure.unit : '';
              if (val.seriesType === 'candlestick') {
                // val.open, val.close, val.low, val.high, value]
                return `<tr><td class="label">${val.marker} ${cutName(val.seriesName, 20)}</td>
<td><div class="value"><div><span>ОТКР:</span> ${this.roundData(val.value[1])}</div><div><span>ЗАКР:</span> ${this.roundData(val.value[2])}</div><div><span>МИН:</span> ${this.roundData(val.value[3])}</div><div><span>МАКС:</span> ${this.roundData(val.value[4])}</div></div></td></tr>`;
              } else {
                return `<tr><td class="label">${val.marker} ${cutName(val.seriesName, 20)}</td>
<td><div class="value"><b>${this.roundData(val.value[1])}</b> ${cutName(unit, 10)}</div></td></tr>`;
              }
            }
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
      right: '20px',
      showTitle: false,
      feature: {},
      tooltip: {
        show: true,
        formatter: function (param) {
          return '<div>' + param.title + '</div>';
        },
        backgroundColor: '#222',
        extraCssText: 'color: #fff'
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
    if (changes.config || changes.values || changes.theme || changes.simpleData) {
      this.data = [];
      if (this.config && (this.values || this.simpleData)) {
        if (this.values && this.values.length && this.values[0].data) {
          this.updateData(this.config, this.values);
        }
        if (this.simpleData && this.simpleData.length) {
          this.updateArrayData(this.config, this.simpleData);
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

  roundData(value, numbers = 2) {
    return Math.round(value * Math.pow(10, numbers)) / Math.pow(10, numbers);
  }

  updateArrayData(config: ParamConfigSeries, values: SimpleData[]) {
    const res: SeriesOption[] = [];
    const xAxis: any = {
      type: 'value',
      boundaryGap: true,
      max: values[0].data.length,
      axisLabel: {
        formatter: function (value, index) {
          return value / 1000 + 'kGhz';
        }
      }
    };
    const legend: string[] = values.map((val, ind) => val.title);
    const yAxis: any = {
      type: 'value',
    };

    values.forEach((value, ind) => {

      res.push({
        type: 'line',
        name: value.title,
        lineStyle: {
          color: this.getChartColor(ind),
        },
        itemStyle: {
          color: this.getChartColor(ind),
        },
        data: value.data.map((val, ind) => {
          // return {x: val.timestmp, y: val.value};
          return [ind, val];
        }),
      });
    });

    const magicType = {
      type: ['bar', 'line'],
    };

    this.options = {
      ...this.options,
      xAxis,
      yAxis,
      legend: {data: legend, bottom: `8px`, show: true, type: 'scroll'},
      series: res,
      // dataZoom: [
      //   {
      //     type: 'slider'
      //   },
      //   {
      //     type: 'inside'
      //   }
      // ],
      grid: {
        ...this.options.grid,
        left: this.margin.left + 30,
        right: this.margin.right + 30,
      },
      toolbox: {
        ...this.options.toolbox, feature: {
          ...(this.options.toolbox as any).feature,
          saveAsImage: {show: true, backgroundColor: BackGround[this.theme]},
          magicType,
          // dataView: {...(this.options.toolbox as any).feature.dataView, backgroundColor: BackGround[this.theme]},
        }
      }
    };

  }

  updateData(config: ParamConfigSeries, values: ItemSeries[]) {
    const res: SeriesOption[] = [];
    const legend: string[] = [];
    const xAxis: any = {
      type: 'time',
      boundaryGap: false,
      axisLabel: {
        formatter: '{d} {MMM} {yy}\n{HH}:{mm}',
      }
    };
    let yAxis: any[] = [];
    this.uniqTitles = [];

    values = this.updateValueTimeZone(values);
    const value = values[0];
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
      xAxis.min = times.min - FULL_DAY;
      xAxis.max = times.max + FULL_DAY;
    } else {
      xAxis.min = period.startTime;
      xAxis.max = period.endTime;
    }
    if (config.viewtype !== ChartViews.stackedAreaChart) {
      const diff = Math.round((xAxis.max - xAxis.min) * 0.02);
      xAxis.min = xAxis.min - diff;
      xAxis.max = xAxis.max + diff;
    }
    const measures = values.map(val => val.device.param.measure.id).filter((value, index, self) => self.indexOf(value) === index);
    if (measures.length > 1 && config.viewtype !== ChartViews.stackedAreaChart) {

      yAxis = values.map((val, ind) => {
        const maxmin = this.getMaxMin(val);
        const diff = Math.round((maxmin.max - maxmin.min) * 0.1);
        return {
          type: 'value',
          min: Math.round(maxmin.min - diff),
          max: Math.round(maxmin.max + diff),
          position: ind % 2 === 0 ? 'left' : 'right',
          offset: 60 * Math.floor(ind / 2),
          axisLine: {
            show: true,
            lineStyle: {
              color: this.getChartColor(ind)
            },
          },
          splitLine: {show: false},
          axisLabel: {
            formatter: '{value} ',
            color: this.getChartColor(ind)
          }
        };
      });

    } else {
      yAxis.push({
        type: 'value',
        splitLine: {
          lineStyle: {
            color: ['#aaa', '#aaa']
          }
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: this.getChartColor(0)
          },
        },
        axisLabel: {
          formatter: '{value} ',
          color: this.getChartColor(0)
        }
      });
    }


    if (config.viewtype === ChartViews.histogramChart) {

      values.forEach((value, ind) => {
        const title = this.findUniqName(value.title) + ' ' + (value.device.param.measure.unit ? value.device.param.measure.unit : '');
        legend.push(title);
        res.push({
          type: 'bar',
          data: value.data.map((val: any) => {
            // return {x: val.timestmp, y: val.value};
            return [val.timestmp, val.value, value];
          }),
          itemStyle: {
            color: this.getChartColor(ind),
          },
          name: title,
          yAxisIndex: yAxis.length > 1 ? ind : 0,
        });
      });
    } else if (config.viewtype === ChartViews.candlestickBarChart) {
      values.forEach((value, ind) => {
        const title = this.findUniqName(value.title) + ' ' + (value.device.param.measure.unit ? value.device.param.measure.unit : '');
        legend.push(title);
        res.push({
          type: 'candlestick',
          data: value.data.map((val: any) => {
            // return {x: val.timestmp, y: val.value};
            return [val.timestmp, val.open, val.close, val.low, val.high, value];
          }),
          name: title,
          yAxisIndex: yAxis.length > 1 ? ind : 0,
        });
      });
    } else {
      values.forEach((value, ind) => {
        const title = this.findUniqName(value.title) + ' ' + (value.device.param.measure.unit ? value.device.param.measure.unit : '');
        legend.push(title);

        if (config.viewtype === ChartViews.stackedAreaChart) {
          res.push({
            type: 'line',
            stack: 'Total',
            smooth: true,
            name: title,
            yAxisIndex: yAxis.length > 1 ? ind : 0,
            data: value.data.map((val: any) => {
              // return {x: val.timestmp, y: val.value};
              return [val.timestmp, val.value, value];
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
            itemStyle: {
              // color: this.getChartColor(ind),
              color: getGradient(ind)
            },
            areaStyle: {
              opacity: 0.8,
              // color: this.getChartColor(ind)
              color: getGradient(ind)
            },
          });
        } else {

          let markArea: any;
          if (config.viewtype === ChartViews.lineWeekend/* && config.duration === SeriesDuration.day*/) {

            const data = [];
            const days = Math.ceil((xAxis.max - xAxis.min) / FULL_DAY);
            if (days > 1) { // если интервал больше суток
              for (let i = 0; i < days; i++) {
                const date = (new Date(xAxis.min + i * FULL_DAY));
                this.modifyTime(date, value.device.object.timezone);
                const day = date.getUTCDay();
                if (day === 0) {// Воскресенье

                  const d = (new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0));
                  // this.modifyTime(d, 0);
                  data.push([
                    {
                      // name: 'Peak',
                      xAxis: d.getTime()
                    },
                    {
                      xAxis: d.getTime() + FULL_DAY
                    }
                  ]);
                }

                if (day === 6) { // Суббота
                  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
                  // this.modifyTime(d, 0);
                  data.push([
                    {
                      // name: 'Peak',
                      xAxis: d.getTime()
                    },
                    {
                      xAxis: d.getTime() + FULL_DAY * 2
                    }
                  ]);
                  i++;
                }
              }
            }

            // xAxis.min = period.startTime;
            // xAxis.max = period.endTime;

            markArea = {
              itemStyle: {
                color: RedZone[this.theme]
              },
              data
            };
          }

          res.push({
            type: 'line',
            smooth: true,
            name: title,
            markArea,
            yAxisIndex: yAxis.length > 1 ? ind : 0,
            lineStyle: {
              color: this.getChartColor(ind),
            },
            itemStyle: {
              color: this.getChartColor(ind),
            },
            data: value.data.map((val: any) => {
              // return {x: val.timestmp, y: val.value};
              return [val.timestmp, val.value, value];
            }),
          });
        }
      });
    }
    const magicType = config.viewtype === ChartViews.candlestickBarChart ? {} : {
      type: yAxis.length === 1 ? ['bar', 'stack', 'line'] : ['bar', 'line'],
    };

    this.options = {
      ...this.options,
      xAxis,
      yAxis,
      legend: {data: legend, bottom: `8px`, show: true, type: 'scroll'},
      series: res,
      grid: {
        ...this.options.grid,
        left: this.margin.left + Math.floor(yAxis.length / 2) * 30,
        right: this.margin.right + Math.floor(yAxis.length / 2) * 30,
      },
      toolbox: {
        ...this.options.toolbox, feature: {
          ...(this.options.toolbox as any).feature,
          saveAsImage: {show: true, backgroundColor: BackGround[this.theme]},
          magicType,
          // dataView: {...(this.options.toolbox as any).feature.dataView, backgroundColor: BackGround[this.theme]},
        }
      }
    };
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

  getMaxMinSimple(values: SimpleData['data']) {
    let max = Number.MIN_VALUE, min = Number.MAX_VALUE;
    values.forEach((value) => {
      if (value > max) {
        max = value;
      }
      if (value < min) {
        min = value;
      }
    });
    return {max, min};
  }

  getMaxMin(values: ItemSeries) {
    let max = Number.MIN_VALUE, min = Number.MAX_VALUE;
    if (this.config.charttype === ChartTypes.candlestickBarChart) {
      values.data.forEach((val: SeriesCandleValue) => {
        if (val.high > max) {
          max = val.high;
        }
        if (val.low < min) {
          min = val.low;
        }
      });
    } else {
      values.data.forEach((val: SeriesLineValue) => {
        if (val.value > max) {
          max = val.value;
        }
        if (val.value < min) {
          min = val.value;
        }
      });
    }
    return {max, min};
  }

  updateValueTimeZone(values: ItemSeries[]): ItemSeries[] {
    return values.map(value => {
      if (value.data) {
        return {
          ...value,
          data: value.data.map((val: SeriesLineValue) => {
            const date = new Date(val.timestmp);
            this.modifyTime(date, 0);
            return {
              value: val.value,
              timestmp: date.getTime(),
            };
          })
        };
      }
      return value;
    });
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
    this.modifyTime(d, timezone);
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
    this.modifyTime(firstDay, timezone);
    lastDay.setTime(firstDay.getTime() + 7 * 24 * 60 * 60 * 1000);

    res.startTime = firstDay.getTime();
    res.endTime = lastDay.getTime();
    res.text = ('0' + firstDay.getDate()).slice(-2) + '/' + ('0' + (firstDay.getMonth() + 1)).slice(-2) + '/' + firstDay.getFullYear() +
      ' - ' +
      ('0' + lastDay.getDate()).slice(-2) + '/' + ('0' + (lastDay.getMonth() + 1)).slice(-2) + '/' + lastDay.getFullYear();

    return res;
  }

  modifyTime(date, timezone) {
    return date.setTime(date.getTime() + (date.getTimezoneOffset() - timezone * 60) * 60000); // set object timezone
  }


  getMonth(num, timezone) {
    const res: any = {};
    const d: Date = new Date();
    d.setHours(0, 0, 0);
    d.setDate(1);
    d.setMonth(d.getMonth() - num);
    this.modifyTime(d, timezone);
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


function makeTimeScaleOption(data, opt) {
  opt = opt || {};
  const useUTC = opt.useUTC;
  const tooltipFormatter = opt.tooltipFormatter;
  return {
    useUTC: useUTC,
    tooltip: {
      trigger: 'axis',
      // test in Safari (NaN-NaN-NaN NaN:NaN:NaN)
      formatter: tooltipFormatter
    },
    xAxis: [{
      type: 'time',
      splitNumber: 7,
      axisLabel: {
        formatter: function (tick) {
          return echarts.time.format(
            tick,
            '{yyyy}-{MM}-{dd} {HH}:{mm}:{ss}',
            useUTC
          );
        },
        rotate: 10
      },
      splitLine: {
        show: false
      }
    }],
    yAxis: [{
      type: 'value',
      splitLine: {
        show: false
      }
    }],
    series: [{
      type: 'line',
      smooth: true,
      data: data,
      label: {
        show: true,
        formatter: function (params) {
          return echarts.time.format(
            params.value[0],
            '{yyyy}-{MM}-{dd} {HH}:{mm}:{ss}',
            useUTC
          );
        }
      }
    }]
  };
}
