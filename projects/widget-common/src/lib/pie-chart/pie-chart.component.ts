import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit} from '@angular/core';
import {ItemInterval, ItemSingle, ParamConfigSingle, SiteTheme} from '../widget.interface';
import {EChartsOption, SeriesOption} from 'echarts/types/dist/echarts';


@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PieChartComponent implements OnInit, OnChanges, OnDestroy {


  @Input() values: ItemInterval | ItemSingle;
  @Input() config: ParamConfigSingle;
  @Input() locale = 'en';
  @Input() noDataMessage = 'No data';
  @Input() width = 250;
  @Input() height = 250;
  @Input() margin = {
    top: 25,
    right: 25,
    bottom: 25,
    left: 25
  };

  @Input() theme: SiteTheme;

  options: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis'
    },
    toolbox: {
      feature: {
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
    legend: {
      top: 'bottom'
    },
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


  display = false;
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
    if (changes.config || changes.values || changes.theme) {
      if (this.config && this.values) {
        this.updateData(this.config, this.values);
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

  resizeChart() {
    if (this.echartsInstance) {
      this.echartsInstance.resize();
    }
  }

  updateData(config: ParamConfigSingle, values: ItemInterval | ItemSingle) {

    console.log('updateData', config, values);
    const res: SeriesOption[] = [];

    this.uniqTitles = [];

    const data = (values.data as any).map(val => ({
      value: val.value,
      name: val.key
    }));

    res.push({
      name: 'Chart',
      type: 'pie',
      radius: '55%',
      center: ['50%', '50%'],
      data: data,
      // roseType: 'radius',
      // roseType: 'area',
      label: {
        color: this.theme === SiteTheme.dark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
      },
      labelLine: {
        lineStyle: {
          color: this.theme === SiteTheme.dark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
        },
        smooth: 0.2,
        length: 10,
        length2: 20
      },
      itemStyle: {
        borderRadius: 4,
        color: ({seriesIndex, dataIndex}) => this.getChartColor(dataIndex),
      },
      // itemStyle: {
      //   color: '#c23531',
      //   shadowBlur: 200,
      //   shadowColor: 'rgba(0, 0, 0, 0.5)'
      // },
      animationType: 'scale',
      animationEasing: 'elasticOut',
      animationDelay: function (idx) {
        return Math.random() * 200;
      }
    });

    this.options = {...this.options, series: res};
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

  getChartColor(seed) {
    if (this.theme === SiteTheme.dark) {
      return this.lightColor[seed % this.darkColor.length].color;
    } else {
      return this.darkColor[seed % this.lightColor.length].color;
    }

  }
}
