import {ChangeDetectionStrategy, Component, Input, NgModule, OnChanges, OnInit} from '@angular/core';
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
import {NvD3Module} from 'angular2-nvd3';
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
export class ChartComponent implements OnInit, OnChanges {


  data = [];
  options;

  @Input() values: ItemSeries[];
  @Input() config: ParamConfigSeries;
  @Input() noDataMessage = 'No data';
  @Input() height = 250;
  @Input() margin = {
    top: 20,
    right: 50,
    bottom: 40,
    left: 65
  };

  theme: SiteTheme;

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


  constructor() {


  }

  ngOnChanges() {
    this.data = [];
    if (this.config && this.values) {
      if (this.values.length && this.values[0].data) {
        this.options = {chart: this.generateChartOptions(this.config, this.values[0])};
        this.data = this.generateData(this.config, this.values);
      }
    }
  }

  genData() {
    return stream_layers(3, 50 + Math.random() * 50, .1).map(function (data, i) {
      return {
        key: 'Stream' + i,
        values: data
      };
    });

    /* Inspired by Lee Byron's test data generator. */
    function stream_layers(n, m, o) {
      if (arguments.length < 3) {
        o = 0;
      }

      function bump(a) {
        let x = 1 / (.1 + Math.random()),
          y = 2 * Math.random() - .5,
          z = 10 / (.1 + Math.random());
        for (let i = 0; i < m; i++) {
          let w = (i / m - y) * z;
          a[i] += x * Math.exp(-w * w);
        }
      }

      return d3.range(n).map(function () {
        let a = [], i;
        for (i = 0; i < m; i++) {
          a[i] = o + o * Math.random();
        }
        for (i = 0; i < 5; i++) {
          bump(a);
        }
        return a.map(stream_index);
      });
    }

    /* Another layer generator using gamma distributions. */
    function stream_waves(n, m) {
      return d3.range(n).map(function (i) {
        return d3.range(m).map(function (j) {
          let x = 20 * j / m - i / 3;
          return 2 * x * Math.exp(-.5 * x);
        }).map(stream_index);
      });
    }

    function stream_index(d, i) {
      return {x: i, y: Math.max(0, d)};
    }

  }


  ngOnInit() {
  }

  generateData(config: ParamConfigSeries, values: ItemSeries[]) {
    if (config.charttype === ChartTypes.histogramChart) {


      // return this.genData();
      return values.map((value, ind) => {
        return {
          values: value.data.map((val: any) => {
            return {x: val.timestmp, y: val.value};
          }),
          key: value.title,
        };
        // return d3.range(3).map{
        //   values: value.data.map((val: any, i) => {
        //     return {x: i, y: val.value};
        //   }),
        //   key: value.title,
        // });
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
          key: value.title,
          values: value.data
        };
      });
    }
  }


  generateChartOptions(config: ParamConfigSeries, values: ItemSeries) {
    let res = {};
    const zoom = {
      'enabled': true,
      'scaleExtent': [
        1, 48
      ],
      'useFixedDomain': false,
      'useNiceScale': true,
      'horizontalOff': false,
      'verticalOff': true,
      'unzoomEventType': 'dblclick.zoom'
    };


    let period;
    let xDomain = [];
    let yDomain;
    const chartdatamin = [];
    const chartdatamax = [];

    if (values.device.param.type === PARAM_TYPE.signal) {
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
        period = this.getDay(config.count, values.device.object.timezone);
        break;
      case SeriesDuration.month:
        period = this.getMonth(config.count, values.device.object.timezone);
        zoom.scaleExtent = [1, 192];
        break;
      case SeriesDuration.week:
        zoom.scaleExtent = [1, 48];
        period = this.getWeek(config.count, values.device.object.timezone);
        break;
      default:
        period = this.getDate();
    }

    if (config.generator) {
      const times = this.getMaxMinTimeline(values);
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
        duration: 500,
        stacked: true,
        xAxis: {
          axisLabel: 'Дата',
          ticks: 5,
          showMaxMin: true,
          'margin': {
            'top': 0,
            'right': 0,
            'bottom': 0,
            'left': 0
          },
          'tickSubdivide': 10,
          'tickSize': 2,
          'tickPadding': 2,
          // rotateLabels: 30,
          tickFormat: (d) => {
            return this.tickMultiFormat(new Date(d));
          },
        },
        zoom,
        yAxis: {
          axisLabel: values.device.param.measure.title ? `${values.device.param.measure.title} [${values.device.param.measure.unit}]` : '',
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
          if (typeof d !== 'undefined') {
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
        legend: {
          rightAlign: false
        },
        useVoronoi: true,
        clipEdge: true,
        duration: 100,
        useInteractiveGuideline: true,
        xAxis: {
          axisLabel: 'Дата',
          ticks: 5,
          showMaxMin: true,
          'margin': {
            'top': 0,
            'right': 0,
            'bottom': 0,
            'left': 0
          },
          'tickSubdivide': 10,
          'tickSize': 2,
          'tickPadding': 2,
          // rotateLabels: 30,
          tickFormat: (d) => {
            return this.tickMultiFormat(new Date(d));
          },
        },
        xDomain,
        yDomain,
        yAxis: {
          axisLabel: values.device.param.measure.title ? `${values.device.param.measure.title} [${values.device.param.measure.unit}]` : '',
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


    function dateToStr(d) {
      return ('00' + d.getDate()).slice(-2) + '-' +
        ('00' + (d.getMonth() + 1)).slice(-2) + '-' +
        d.getFullYear() + ' ' +
        ('00' + d.getHours()).slice(-2) + ':' +
        ('00' + d.getMinutes()).slice(-2);
      /*+ ":" +   ("00" + d.getSeconds()).slice(-2)*/
    }

    function candleContentGeneration(data) {
      // we assume only one series exists for this chart
      const d: any = data.series[0].data;
      // match line colors as defined in nv.d3.css
      const color: any = d.open < d.close ? '#2ca02c' : '#d62728';
      return '' +
        '<h3 style="color: ' + color + '">' + dateToStr(new Date(d.timestmp)) + '</h3>' +
        '<table>' +
        '<tr><td>' + 'open' + ':</td><td>' + tickFormat(d.open) + '</td></tr>' +
        '<tr><td>' + 'close' + ':</td><td>' + tickFormat(d.close) + '</td></tr>' +
        '<tr><td>' + 'high' + ':</td><td>' + tickFormat(d.high) + '</td></tr>' +
        '<tr><td>' + 'low' + ':</td><td>' + tickFormat(d.low) + '</td></tr>' +
        '</table>';
    }

    function lineContentGenerator(data) {

      // we assume only one series exists for this chart
      let dvalue: any = '';
      let d: any = {};
      if (typeof data.series[0].point !== 'undefined') {
        d = data.series[0].point;
      } else {
        d = data.series[0].data;
      }
      const dtime = '<tr><td colspan: any = 3>' + moment(d.timestmp).format('DD-MM-YYYY HH:mm') + '</td></tr>';
      data.series.forEach(function (data) {
        const color: any = data.color;
        if (data.value === null) {
          dvalue += '<tr><td></td><td><h5 style="color: ' + color + ';font-weight: bold">' + data.key +
            '</h5></td><td>Нет данных</td></tr>';
        } else {
          dvalue += '<tr><td></h5></td><td><h5 style="color: ' + color + ';font-weight: bold">' + data.key +
            '</h5></td><td> ' + parseFloat(data.value).toFixed(2) + '</td></tr>';
        }
      });
      return '<table>' + dtime + dvalue + '</table>';

    }

    return res;
  }

  getMaxMin(values: ItemSeries) {
    let max = Number.MIN_VALUE, min = Number.MAX_VALUE;
    values.data.forEach((val: SeriesLineValue) => {
      if (val.value > max) {
        max = val.value;
      }
      if (val.value < min) {
        min = val.value;
      }
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
