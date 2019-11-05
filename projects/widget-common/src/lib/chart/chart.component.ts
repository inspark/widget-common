import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  NgModule,
  OnChanges, OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  ChartTypes,
  ItemSeries,
  PARAM_TYPE, ParamConfig,
  ParamConfigSeries,
  SeriesDuration,
  SeriesLineValue,
  SiteTheme
} from '../widget.interface';
import * as d3 from 'd3';
import 'nvd3';
import {NvD3Module, NvD3Component} from 'ng2-nvd3';
import {CommonModule} from '@angular/common';
import {PieChartComponent} from '../pie-chart/pie-chart.component';
import * as moment_ from 'moment';

const moment = moment_;

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartComponent implements OnInit, OnChanges, OnDestroy {

  @ViewChild(NvD3Component) child: NvD3Component;

  data = [];
  options;

  @Input() values: ItemSeries[];
  @Input() config: ParamConfigSeries;
  @Input() noDataMessage = 'No data';
  @Input() width = 250;
  @Input() height = 250;
  @Input() margin = {
    top: 25,
    right: 5,
    bottom: 50,
    left: 65
  };

  theme: SiteTheme;

  uniqTitles = [];

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


  tickMultiFormat: any = d3.time.format.multi([
    ['%b %-d %-H:%M', function (d) {
      return d.getMinutes();
    }], // not the beginning of the hour
    ['%-H:%M', function (d) {
      return d.getHours();
    }], // not midnight
    ['%b %-d', function (d) {
      return d.getDate();
    }], // not the first of the month
    ['%b %-d', function (d) {
      return d.getMonth() !== 1;
    }], // not Jan 1st
    ['%Y', function () {
      return true;
    }]
  ]);


  constructor(private cdr: ChangeDetectorRef) {


  }

  ngOnChanges(changes) {
    if (this.child && (changes.width || changes.height)) {
      this.options = {
        chart: {...this.options.chart, height: this.height}
      };
      this.cdr.detectChanges();
      if (this.child && this.child.chart) {
        this.child.chart.update();
      }
    }
    if (changes.config || changes.values) {
      this.data = [];
      if (this.config && this.values) {
        if (this.values.length && this.values[0].data) {
          this.options = {
            chart: this.generateChartOptions(this.config, this.values),
          };
          this.data = this.generateData(this.config, this.values);
        }
        this.cdr.detectChanges();
      }
    }
    if (this.child && this.child.chart) {
      this.child.chart.update();
    }
  }

  ngOnInit() {
  }

  ngOnDestroy() {
  }


  generateData(config: ParamConfigSeries, values: ItemSeries[]) {
    this.uniqTitles = [];
    if (config.charttype === ChartTypes.histogramChart) {

      return values.map((value, ind) => {
        return {
          values: value.data.map((val: any) => {
            return {x: val.timestmp, y: val.value};
          }),
          key: value.title,
        };
      });
    } else if (config.charttype === ChartTypes.candlestickBarChart) {
      return values.map((value, ind) => {
        return {
          seriesIndex: ind,
          values: value.data,
          key: value.title,
        };
      });
    } else {

      return values.map((value, ind) => {
        return {
          color: this.getChartColor(ind),
          key: this.findUniqName(value.title),
          values: value.data
        };
      });
    }
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

  generateChartOptions(config: ParamConfigSeries, values: ItemSeries[]) {
    const value = values[0];
    let res = {};
    const zoom = {
      'enabled': true,
      'scaleExtent': [
        1, 48
      ],
      'useFixedDomain': false,
      'useNiceScale': false,
      'horizontalOff': false,
      'verticalOff': true,
      'unzoomEventType': 'dblclick.zoom'
    };


    let period;
    let xDomain = [];
    let yDomain;
    const chartdatamin = [];
    const chartdatamax = [];

    if (value.device.param.type === PARAM_TYPE.signal) {
      chartdatamax[0] = 1.2;
      chartdatamin[0] = -0.2;
    } else {
      const maxmin = this.getMaxMin(values);
      chartdatamax[0] = maxmin.max;
      chartdatamin[0] = maxmin.min;
      if (chartdatamax[0] === chartdatamin[0]) {
        chartdatamax[0] += 10;
      }
    }

    if ([ChartTypes.lineChart, ChartTypes.histogramChart, ChartTypes.stackedAreaChart].indexOf(config.charttype) !== -1) {

      if (config.charttype !== ChartTypes.stackedAreaChart) {
        const delta: any = (chartdatamax[0] - chartdatamin[0]) / 10;
        yDomain = [chartdatamin[0] - delta, chartdatamax[0] + delta];
      }


    }

    switch (config.duration) {
      case SeriesDuration.day:
        zoom.scaleExtent = [1, 6];
        period = this.getDay(config.count, value.device.object.timezone);
        break;
      case SeriesDuration.month:
        period = this.getMonth(config.count, value.device.object.timezone);
        zoom.scaleExtent = [1, 192];
        break;
      case SeriesDuration.week:
        zoom.scaleExtent = [1, 48];
        period = this.getWeek(config.count, value.device.object.timezone);
        break;
      default:
        period = this.getDate();
    }

    if (config.generator) {
      const times = this.getMaxMinTimeline(value);
      xDomain = [times.min, times.max];
    } else {
      xDomain = [period.startTime, period.endTime];
    }

    if (config.charttype === ChartTypes.histogramChart) {

      res = {
        type: 'multiBarChart',
        height: this.height,
        margin: this.margin,
        clipEdge: true,
        duration: 300,
        useInteractiveGuideline: true,
        xAxis: {
          axisLabel: 'Дата',
          showMaxMin: true,
          axisLabelDistance: 5,
          tickFormat: (d) => {
            return this.tickMultiFormat(new Date(d));
          },
        },
        zoom,
        yAxis: {
          axisLabel: value.device.param.measure.title ? `${value.device.param.measure.title} [${value.device.param.measure.unit}]` : '',
          tickFormat: tickFormat,
          axisLabelDistance: 5
        },
      };
    } else {

      res = {
        type: config.charttype,
        noData: this.noDataMessage,
        xScale: d3.time.scale(),
        showControls: true,
        height: this.height,
        margin: this.margin,
        x: function (d) {
          if (d) {
            return d.timestmp;
          } else {
            return 0;
          }
        },
        y: function (d) {
          if (!d) {
            return null;
          }
          return config.charttype === ChartTypes.candlestickBarChart ? d.close : d.value;
        },
        useVoronoi: true,
        clipEdge: false,
        duration: 300,
        useInteractiveGuideline: true,
        xAxis: {
          axisLabel: 'Дата',
          showMaxMin: false,
          tickFormat: (d) => {
            return this.tickMultiFormat(new Date(d));
          },
        },
        xDomain,
        yDomain,
        yAxis: {
          axisLabel: value.device.param.measure.title ? `${value.device.param.measure.title} [${value.device.param.measure.unit}]` : '',
          tickFormat: tickFormat,
          axisLabelDistance: 5
        },
        zoom,
      };
    }

    function tickFormat(d) {
      if (d == null) {
        return null;
        // return -10000000;
      }
      if (d > 9999) {
        return d3.format(',.1e')(d);
      } else if (d > 999) {
        return d3.format('f')(d);
      } else if (d > 99) {
        return d3.format('.2f')(d);
      }
      return d3.format('.02f')(d);
    }

    return res;
  }

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
    values.data.forEach((val: SeriesLineValue) => {
      if (val.timestmp > max) {
        max = val.timestmp;
      }
      if (val.timestmp < min) {
        min = val.timestmp;
      }
    });
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
    firstDay.setDate(d.getDate() - day - num * 7 + 1);
    firstDay.setHours(0, 0, 0);
    firstDay.setTime(firstDay.getTime() + (-firstDay.getTimezoneOffset() - timezone * 60) * 60000); // set object timezone
    res.startTime = firstDay.getTime();
    lastDay.setTime(firstDay.getTime() + 7 * 24 * 60 * 60 * 1000);
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
    ChartComponent,
    PieChartComponent,
  ],
  imports: [
    NvD3Module,
    CommonModule
  ],
  exports: [
    ChartComponent,
    PieChartComponent,
  ],
  entryComponents: [ChartComponent, PieChartComponent]
})
export class ChartComponentModule {
}
