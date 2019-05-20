"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
var core_1 = require("@angular/core");
var widget_interface_1 = require("../widget.interface");
var PieChartComponent = /** @class */ (function () {
    function PieChartComponent() {
    }
    PieChartComponent.prototype.ngOnChanges = function () {
        if (this.config && this.values) {
            this.options = this.generatePieChartOptions(this.config.charttype);
            this.data = this.values.data;
        }
    };
    PieChartComponent.prototype.ngOnInit = function () {
    };
    PieChartComponent.prototype.generatePieChartOptions = function (chartType) {
        return {
            chart: {
                type: 'pieChart',
                height: chartType === widget_interface_1.ChartTypes.pieChart ? 300 : 80,
                x: function (d) {
                    return d.key;
                },
                y: function (d) {
                    return d.value;
                },
                showLabels: chartType === widget_interface_1.ChartTypes.pieChart,
                showLegend: chartType === widget_interface_1.ChartTypes.pieChart,
                labelType: 'percent',
                donut: chartType === widget_interface_1.ChartTypes.pieChart,
                donatRatio: 0.38,
                duration: 500,
                transitionDuration: 500,
                labelThreshold: 0.05,
                labelSunbeamLayout: true
            }
        };
    };
    __decorate([
        core_1.Input()
    ], PieChartComponent.prototype, "values");
    __decorate([
        core_1.Input()
    ], PieChartComponent.prototype, "config");
    PieChartComponent = __decorate([
        core_1.Component({
            selector: 'app-pie-chart',
            templateUrl: './pie-chart.component.html',
            styleUrls: ['./pie-chart.component.scss']
        })
    ], PieChartComponent);
    return PieChartComponent;
}());
exports.PieChartComponent = PieChartComponent;
