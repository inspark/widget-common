import {Component, Input, NgModule, OnChanges, OnInit} from '@angular/core';
import {
  ChartTypes, ItemInterval,
  ItemSeries, ItemSingle,
  ParamConfigSeries,
  SiteTheme
} from '../widget.interface';

@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss'],

})
export class PieChartComponent implements OnInit, OnChanges {


  data: any;
  options;

  @Input() values: ItemInterval | ItemSingle;
  @Input() config: ParamConfigSeries;
  @Input() noDataMessage = 'No data';
  @Input() height = null;

  theme: SiteTheme;

  constructor() {
  }

  ngOnChanges() {
    if (this.config && this.values) {
      this.options = this.generatePieChartOptions(this.config.charttype);
      this.data = this.values.data;
    }
  }

  ngOnInit() {
  }


  generatePieChartOptions(chartType: ChartTypes) {
    return {
      chart: {
        type: 'pieChart',
        height: this.height ? this.height : (chartType === ChartTypes.pieChart ? 300 : 80),
        x: function (d) {
          return d.key;
        },
        y: function (d) {
          return d.value;
        },
        showLabels: chartType === ChartTypes.pieChart,
        showLegend: chartType === ChartTypes.pieChart,
        labelType: 'percent',
        donut: chartType === ChartTypes.pieChart,
        donatRatio: 0.38,
        duration: 500,
        transitionDuration: 500,
        labelThreshold: 0.05,
        labelSunbeamLayout: true,
        noData: this.noDataMessage,
      }
    };
  }

}
