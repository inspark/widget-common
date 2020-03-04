import {ChangeDetectorRef, Component, Input, NgModule, OnChanges, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {
  ChartTypes, ItemInterval,
  ItemSeries, ItemSingle,
  ParamConfigSeries,
  SiteTheme
} from '../widget.interface';
import {NvD3Component} from "ng2-nvd3";

@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss'],

})
export class PieChartComponent implements OnInit, OnChanges, OnDestroy {


  data: any;
  options;

  @Input() values: ItemInterval | ItemSingle;
  @Input() config: ParamConfigSeries;
  @Input() noDataMessage = 'No data';
  @Input() height = null;
  @Input() width = 250;
  @ViewChild(NvD3Component) child: NvD3Component;

  theme: SiteTheme;

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
        this.options = this.generatePieChartOptions(this.config.charttype);
        this.data = this.values.data;
      }
    }
  }

  ngOnInit() {
  }

  ngOnDestroy() {
  }



  generatePieChartOptions(chartType: ChartTypes) {
    return {
      chart: {
        type: 'pieChart',
        tooltip: {enabled: false},
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
        donutRatio: 0.38,
        duration: 500,
        transitionDuration: 500,
        labelThreshold: 0.05,
        labelSunbeamLayout: false,
        noData: this.noDataMessage,
      }
    };
  }

}
