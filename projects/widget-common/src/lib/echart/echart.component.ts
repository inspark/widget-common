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
    {offset: 0, color: 'rgb(128, 255, 165)'},
    {offset: 1, color: 'rgb(1, 191, 236)'}
  ]),
  new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    {offset: 0, color: 'rgb(0, 221, 255)'},
    {offset: 1, color: 'rgb(77, 119, 255)'}
  ]),
  new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    {offset: 0, color: 'rgb(55, 162, 255)'},
    {offset: 1, color: 'rgb(116, 21, 219)'}
  ]),
  new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    {offset: 0, color: 'rgb(255, 0, 135)'},
    {offset: 1, color: 'rgb(135, 0, 157)'}
  ]),
  new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    {offset: 0, color: 'rgb(255, 191, 0)'},
    {offset: 1, color: 'rgb(224, 62, 76)'}
  ])
];

const getGradient = (seed: number) => GRADIENT[seed % GRADIENT.length];

const cutName = (name: string, length: number) => {
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
  @Input() config: ParamConfigSeries; // ожидается поле duration и count (count трактуем как shift)
  @Input() locale = 'en';
  @Input() noDataMessage = 'No data';
  @Input() width = 250;
  @Input() height = 250;
  @Input() margin = {top: 70, right: 20, bottom: 60, left: 20};
  @Input() theme: SiteTheme;

  data: any[] = [];
  options: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      appendToBody: true,
      renderMode: 'html',
      trigger: 'axis',
      axisPointer: {type: 'cross'},
      className: 'label-formatter',
      formatter: (params: any[]) => {
        let res = 'No data';
        if (params && params[0]) {
          res = `<div class="title">${new DatePipe(this.getLocale(this.locale)).transform(params[0].value[0], 'd MMM y, HH:mm')}</div><table>`;
          res += params.map((val: any) => {
            if (typeof val.value[val.value.length - 1] === 'number') {
              return `<tr><td class="label">${val.marker} ${cutName(val.seriesName, 20)}</td>
<td><div class="value"><b>${this.roundData(val.value[1])}</b></div></td></tr>`;
            } else {
              const unit = val.value[val.value.length - 1].device.param.measure.unit ? val.value[val.value.length - 1].device.param.measure.unit : '';
              if (val.seriesType === 'candlestick') {
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
    xAxis: {type: 'time', boundaryGap: false},
    yAxis: {type: 'value'},
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

  uniqTitles: string[] = [];
  initOpts: any = {locale: this.locale.toLocaleUpperCase()};

  darkColor = [
    {'color': '#00FF7F'}, {'color': '#00E0E0'}, {'color': '#FF00FF'}, {'color': '#B2CCE5'}, {'color': '#F1F227'},
    {'color': '#FDE3A7'}, {'color': '#F64747'}, {'color': '#8BB82D'}, {'color': '#1E90FF'}, {'color': '#D2527F'},
    {'color': '#91A6BA'}
  ];

  lightColor = [
    {'color': '#007A4B'}, {'color': '#3477DB'}, {'color': '#D252B2'}, {'color': '#708090'}, {'color': '#AF851A'},
    {'color': '#BB671C'}, {'color': '#E00000'}, {'color': '#005031'}, {'color': '#34415E'}, {'color': '#58007E'},
    {'color': '#2E343B'}
  ];

  display = true;
  echartsInstance: any;

  constructor(private cdr: ChangeDetectorRef) {
  }

  ngOnChanges(changes: any) {
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

  ngOnDestroy() {}

  onChartInit(ec: any) {
    this.echartsInstance = ec;
  }

  getLocale(locale: string) {
    return locale.toLowerCase() === 'ru' ? 'ru-RU' : 'en-US';
  }

  resizeChart() {
    if (this.echartsInstance) {
      this.echartsInstance.resize();
    }
  }

  roundData(value: number, numbers = 2) {
    return Math.round(value * Math.pow(10, numbers)) / Math.pow(10, numbers);
  }

  updateArrayData(config: ParamConfigSeries, values: SimpleData[]) {
    const res: SeriesOption[] = [];
    const xAxis: any = {
      type: 'value',
      boundaryGap: true,
      max: values[0].data.length,
      axisLabel: {
        formatter: function (value: number) {
          return value / 1000 + 'kGhz';
        }
      }
    };
    const legend: string[] = values.map((val) => val.title || '');
    const yAxis: any = {type: 'value'};

    values.forEach((value, ind) => {
      res.push({
        type: 'line',
        name: value.title,
        lineStyle: {color: this.getChartColor(ind)},
        itemStyle: {color: this.getChartColor(ind)},
        data: value.data.map((val, i) => [i, val]),
      });
    });

    const magicType = {type: ['bar', 'line']};

    this.options = {
      ...this.options,
      xAxis,
      yAxis,
      legend: {data: legend, bottom: `8px`, show: true, type: 'scroll'},
      series: res,
      grid: {
        ...this.options.grid,
        left: this.margin.left + 30,
        right: this.margin.right + 30,
      },
      toolbox: {
        ...this.options.toolbox,
        feature: {
          ...(this.options.toolbox as any).feature,
          saveAsImage: {show: true, backgroundColor: BackGround[this.theme]},
          magicType,
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
      axisLabel: {formatter: '{d} {MMM}\n{HH}:{mm}'}
    };
    let yAxis: any[] = [];
    this.uniqTitles = [];

    values = this.updateValueTimeZone(values);
    const first = values[0];

    // shift трактуем из config.count
    const shift = Math.max(0, Number(config.count || 0));
    const tz = first?.device?.object?.timezone ?? 0;

    // Конечная точка всегда "сейчас" с учётом TZ
    const endNow = this.nowWithTZ(tz);

    // Выбор периода
    let period: { startTime: number; endTime: number; text: string };
    switch (config.duration) {
      case SeriesDuration.day:
        period = this.getDay(shift, tz, endNow);
        break;
      case SeriesDuration.week:
        period = this.getWeek(shift, tz, endNow);
        break;
      case SeriesDuration.month:
        period = this.getMonth(shift, tz, endNow);
        break;
      default:
        period = this.getDay(0, tz, endNow);
    }

    if (config.generator) {
      const times = this.getMaxMinTimeline(first);
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

    const measures = values.map(v => v.device.param.measure.id).filter((v, i, s) => s.indexOf(v) === i);
    if (measures.length > 1 && config.viewtype !== ChartViews.stackedAreaChart) {
      yAxis = values.map((v, ind) => {
        const maxmin = this.getMaxMin(v);
        const diff = Math.round((maxmin.max - maxmin.min) * 0.1);
        return {
          type: 'value',
          min: Math.round(maxmin.min - diff),
          max: Math.round(maxmin.max + diff),
          position: ind % 2 === 0 ? 'left' : 'right',
          offset: 60 * Math.floor(ind / 2),
          axisLine: {show: true, lineStyle: {color: this.getChartColor(ind)}},
          splitLine: {show: false},
          axisLabel: {formatter: '{value} ', color: this.getChartColor(ind)}
        };
      });
    } else {
      yAxis.push({
        type: 'value',
        splitLine: {lineStyle: {color: ['#aaa', '#aaa']}},
        axisLine: {show: true, lineStyle: {color: this.getChartColor(0)}},
        axisLabel: {formatter: '{value} ', color: this.getChartColor(0)}
      });
    }

    if (config.viewtype === ChartViews.histogramChart) {
      values.forEach((value, ind) => {
        const title = this.findUniqName(value.title) + ' ' + (value.device.param.measure.unit ? value.device.param.measure.unit : '');
        legend.push(title);
        res.push({
          type: 'bar',
          data: value.data.map((val: any) => [val.timestmp, val.value, value]),
          itemStyle: {color: this.getChartColor(ind)},
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
          data: value.data.map((val: any) => [val.timestmp, val.open, val.close, val.low, val.high, value]),
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
            data: value.data.map((val: any) => [val.timestmp, val.value, value]),
            lineStyle: {width: 0},
            showSymbol: false,
            emphasis: {focus: 'series'},
            itemStyle: {color: getGradient(ind)},
            areaStyle: {opacity: 0.8, color: getGradient(ind)},
          });
        } else {
          let markArea: any;
          if (config.viewtype === ChartViews.lineWeekend) {
            const data = [];
            const days = Math.ceil((xAxis.max - xAxis.min) / FULL_DAY);
            if (days > 1) {
              for (let i = 0; i < days; i++) {
                const date = (new Date(xAxis.min + i * FULL_DAY));
                this.modifyTime(date, 0);
                const day = date.getUTCDay();
                if (day === 0) {
                  const d = (new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0));
                  data.push([{xAxis: d.getTime()}, {xAxis: d.getTime() + FULL_DAY}]);
                }
                if (day === 6) {
                  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
                  data.push([{xAxis: d.getTime()}, {xAxis: d.getTime() + FULL_DAY * 2}]);
                  i++;
                }
              }
            }
            markArea = {itemStyle: {color: RedZone[this.theme]}, data};
          }

          res.push({
            type: 'line',
            smooth: true,
            name: title,
            markArea,
            yAxisIndex: yAxis.length > 1 ? ind : 0,
            lineStyle: {color: this.getChartColor(ind)},
            itemStyle: {color: this.getChartColor(ind)},
            data: value.data.map((val: any) => [val.timestmp, val.value, value]),
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
        ...this.options.toolbox,
        feature: {
          ...(this.options.toolbox as any).feature,
          saveAsImage: {show: true, backgroundColor: BackGround[this.theme]},
          magicType,
        }
      }
    };
  }

  findUniqName(title: string, ind = 0): string {
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
            return {value: (val as any).value ?? (val as any).close ?? 0, timestmp: date.getTime()};
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

  // ===== ВРЕМЯ И ПЕРИОДЫ С УЧЁТОМ TZ =====

  // "Сейчас" с учётом таймзоны объекта (timezone в часах)
  private nowWithTZ(timezone: number): Date {
    const now = new Date();
    const shiftMs = (now.getTimezoneOffset() - timezone * 60) * 60000;
    return new Date(now.getTime() + shiftMs);
  }

  private startOfDayTZ(d: Date): Date {
    const x = new Date(d.getTime());
    x.setHours(0, 0, 0, 0);
    return x;
  }

  // Неделя начинается в понедельник
  private startOfWeekTZ(d: Date): Date {
    const x = new Date(d.getTime());
    const dow = x.getDay(); // 0..6, где 1 — понедельник при сдвиге
    const mondayOffset = (dow + 6) % 7; // 0 для понедельника
    x.setDate(x.getDate() - mondayOffset);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  private startOfMonthTZ(d: Date): Date {
    const x = new Date(d.getTime());
    x.setDate(1);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  // day:
  // shift=0 -> от начала текущего дня до "сейчас"
  // shift>=1 -> от (сейчас - shift*дней) до "сейчас"
  getDay(shift: number, timezone: number, nowTZ: Date) {
    const end = new Date(nowTZ.getTime());
    let start: Date;
    if (shift === 0) {
      start = this.startOfDayTZ(end);
    } else {
      start = new Date(end.getTime() - shift * FULL_DAY);
    }
    return {
      startTime: start.getTime(),
      endTime: end.getTime(),
      text: ''
    };
  }

  // week:
  // всегда от начала недели; shift=0 текущая неделя, shift>=1 — на shift недель назад
  getWeek(shift: number, timezone: number, nowTZ: Date) {
    const end = new Date(nowTZ.getTime());
    let start = this.startOfWeekTZ(end);
    if (shift > 0) {
      start = new Date(start.getTime() - shift * 7 * FULL_DAY);
    }
    return {
      startTime: start.getTime(),
      endTime: end.getTime(),
      text: ''
    };
  }

  // month:
  // всегда от начала месяца; shift=0 текущий, shift>=1 — на shift месяцев назад
  getMonth(shift: number, timezone: number, nowTZ: Date) {
    const end = new Date(nowTZ.getTime());
    let start = this.startOfMonthTZ(end);
    if (shift > 0) {
      const s = new Date(start.getTime());
      s.setMonth(s.getMonth() - shift);
      start = s;
    }
    return {
      startTime: start.getTime(),
      endTime: end.getTime(),
      text: ''
    };
  }

  // сохраняем для совместимости (используется в markArea)
  modifyTime(date: Date, timezone: number) {
    return date.setTime(date.getTime() + (date.getTimezoneOffset() - timezone * 60) * 60000);
  }

  getChartColor(seed: number) {
    if (this.theme === SiteTheme.dark) {
      return this.darkColor[seed % this.darkColor.length].color;
    }
    return this.lightColor[seed % this.lightColor.length].color;
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

function makeTimeScaleOption(data: any[], opt?: { useUTC?: boolean; tooltipFormatter?: (p: any) => string }) {
  opt = opt || {};
  const useUTC = opt.useUTC;
  const tooltipFormatter = opt.tooltipFormatter;
  return {
    useUTC: useUTC,
    tooltip: {
      trigger: 'axis',
      formatter: tooltipFormatter
    },
    xAxis: [{
      type: 'time',
      splitNumber: 7,
      axisLabel: {
        formatter: function (tick: number) {
          return echarts.time.format(
            tick,
            '{yyyy}-{MM}-{dd} {HH}:{mm}:{ss}',
            useUTC
          );
        },
        rotate: 10
      },
      splitLine: {show: false}
    }],
    yAxis: [{type: 'value', splitLine: {show: false}}],
    series: [{
      type: 'line',
      smooth: true,
      data: data,
      label: {
        show: true,
        formatter: function (params: any) {
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
