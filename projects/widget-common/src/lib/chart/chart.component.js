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
var d3 = require("d3");
var moment = require("moment");
var angular2_nvd3_1 = require("angular2-nvd3");
var common_1 = require("@angular/common");
var pie_chart_component_1 = require("../pie-chart/pie-chart.component");
var ChartComponent = /** @class */ (function () {
    function ChartComponent() {
        this.data = [];
        this.darkColor = [
            { 'color': '#00FF7F' },
            { 'color': '#00E0E0' },
            { 'color': '#FF00FF' },
            { 'color': '#B2CCE5' },
            { 'color': '#F1F227' },
            { 'color': '#FDE3A7' },
            { 'color': '#F64747' },
            { 'color': '#8BB82D' },
            { 'color': '#1E90FF' },
            { 'color': '#D2527F' },
            { 'color': '#91A6BA' }
        ];
        this.lightColor = [
            { 'color': '#007A4B' },
            { 'color': '#3477DB' },
            { 'color': '#D252B2' },
            { 'color': '#708090' },
            { 'color': '#AF851A' },
            { 'color': '#BB671C' },
            { 'color': '#E00000' },
            { 'color': '#005031' },
            { 'color': '#34415E' },
            { 'color': '#58007E' },
            { 'color': '#2E343B' }
        ];
        this.tickMultiFormat = d3.time.format.multi([
            ['%b %-d %-H:%M', function (d) {
                    return d.getMinutes();
                }],
            ['%-H:%M', function (d) {
                    return d.getHours();
                }],
            ['%b %-d', function (d) {
                    return d.getDate();
                }],
            ['%b %-d', function (d) {
                    return d.getMonth() !== 1;
                }],
            ['%Y', function () {
                    return true;
                }]
        ]);
    }
    ChartComponent.prototype.ngOnChanges = function () {
        if (this.config && this.values) {
            if (this.values.length) {
                this.options = { chart: this.generateChartOptions(this.config, this.values[0]) };
                this.data = this.generateData(this.config, this.values);
            }
        }
    };
    ChartComponent.prototype.ngOnInit = function () {
    };
    ChartComponent.prototype.generateData = function (config, values) {
        var _this = this;
        if (config.charttype === widget_interface_1.ChartTypes.candlestickBarChart) {
            return values.map(function (value, ind) {
                return {
                    seriesIndex: ind,
                    values: value.data,
                    key: value.title
                };
            });
        }
        else {
            return values.map(function (value, ind) {
                return {
                    color: _this.getChartColor(ind),
                    key: value.title,
                    values: value.data
                };
            });
        }
    };
    ChartComponent.prototype.generateChartOptions = function (config, values) {
        var _this = this;
        var res = {};
        var zoom = {
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
        var period;
        var xDomain = [];
        var yDomain;
        var chartdatamin = [];
        var chartdatamax = [];
        if (values.device.param.type === widget_interface_1.PARAM_TYPE.signal) {
            chartdatamax[0] = 1.2;
            chartdatamin[0] = -0.2;
        }
        else {
            var maxmin = this.getMaxMin(values);
            chartdatamax[0] = maxmin.max;
            chartdatamin[0] = maxmin.min;
            if (chartdatamax[0] === chartdatamin[0]) {
                chartdatamax[0] += 10;
            }
        }
        if ([widget_interface_1.ChartTypes.lineChart, widget_interface_1.ChartTypes.histogramChart, widget_interface_1.ChartTypes.stackedAreaChart].indexOf(config.charttype) !== -1) {
            if (config.charttype !== widget_interface_1.ChartTypes.stackedAreaChart) {
                var delta = (chartdatamax[0] - chartdatamin[0]) / 10;
                yDomain = [chartdatamin[0] - delta, chartdatamax[0] + delta];
            }
        }
        switch (config.duration) {
            case widget_interface_1.SeriesDuration.day:
                zoom.scaleExtent = [1, 6];
                period = this.getDay(config.count);
                break;
            case widget_interface_1.SeriesDuration.month:
                period = this.getMonth(config.count);
                zoom.scaleExtent = [1, 192];
                break;
            case widget_interface_1.SeriesDuration.week:
                zoom.scaleExtent = [1, 48];
                period = this.getWeek(config.count);
                break;
            default:
                period = this.getDate();
        }
        if (config.generator) {
            var times = this.getMaxMinTimeline(values);
            xDomain = [times.min, times.max];
        }
        else {
            xDomain = [period.startTime, period.endTime];
        }
        res = {
            type: config.charttype === widget_interface_1.ChartTypes.histogramChart ? 'historicalBarChart' : config.charttype,
            noData: 'No data for the period',
            xScale: d3.time.scale(),
            showControls: true,
            height: 250,
            margin: {
                top: 20,
                right: 50,
                bottom: 40,
                left: 65
            },
            x: function (d) {
                if (typeof d !== 'undefined') {
                    return d.timestmp;
                }
                else {
                    return 0;
                }
            },
            y: function (d) {
                return config.charttype === widget_interface_1.ChartTypes.candlestickBarChart ? d.close : d.value;
            },
            legend: {
                rightAlign: false
            },
            useVoronoi: true,
            clipEdge: true,
            duration: 100,
            useInteractiveGuideline: true,
            interactiveLayer: {
                tooltip: {
                    gravity: 's',
                    fixedTop: 65,
                    contentGenerator: function () {
                        return config.charttype === widget_interface_1.ChartTypes.candlestickBarChart ? candleContentGeneration : lineContentGenerator;
                    }()
                }
            },
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
                tickFormat: function (d) {
                    return _this.tickMultiFormat(new Date(d));
                }
            },
            xDomain: xDomain,
            yDomain: yDomain,
            yAxis: {
                axisLabel: values.device.param.measure.title + " [" + values.device.param.measure.unit + "]",
                tickFormat: tickFormat,
                axisLabelDistance: 5
            },
            zoom: zoom,
            tooltip: {
                contentGenerator: function (d) {
                    if (d.point.y == null) {
                        return '<div style="background-color: ' + d.point.color + '">'
                            + '<div>' + moment(d.point.x).format('DD-MM-YYYY HH:mm') + '</div>'
                            + '<div>Нет данных</div>'
                            + '</div>';
                    }
                    return '<div style="background-color: ' + d.point.color + '">'
                        + '<div>' + moment(d.point.x).format('DD-MM-YYYY HH:mm') + '</div>'
                        + '<div>' + parseFloat(d.point.y).toFixed(2) + '</div>'
                        + '</div>';
                },
                ohlcContentGenerator: function (d) {
                    return '<div>test content</div>';
                }
            }
        };
        function tickFormat(d) {
            if (d == null) {
                return null;
                // return -10000000;
            }
            if (d > 9999) {
                return d3.format(',.1e')(d);
            }
            else if (d > 999) {
                return d3.format('f')(d);
            }
            else if (d > 99) {
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
            var d = data.series[0].data;
            // match line colors as defined in nv.d3.css
            var color = d.open < d.close ? '#2ca02c' : '#d62728';
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
            var dvalue = '';
            var d = {};
            if (typeof data.series[0].point !== 'undefined') {
                d = data.series[0].point;
            }
            else {
                d = data.series[0].data;
            }
            var dtime = '<tr><td colspan: any = 3>' + moment(d.timestmp).format('DD-MM-YYYY HH:mm') + '</td></tr>';
            data.series.forEach(function (data) {
                var color = data.color;
                if (data.value === null) {
                    dvalue += '<tr><td></td><td><h5 style="color: ' + color + ';font-weight: bold">' + data.key +
                        '</h5></td><td>Нет данных</td></tr>';
                }
                else {
                    dvalue += '<tr><td></h5></td><td><h5 style="color: ' + color + ';font-weight: bold">' + data.key +
                        '</h5></td><td> ' + parseFloat(data.value).toFixed(2) + '</td></tr>';
                }
            });
            return '<table>' + dtime + dvalue + '</table>';
        }
        return res;
    };
    ChartComponent.prototype.getMaxMin = function (values) {
        var max = Number.MIN_VALUE, min = Number.MAX_VALUE;
        values.data.forEach(function (val) {
            if (val.value > max) {
                max = val.value;
            }
            if (val.value < min) {
                min = val.value;
            }
        });
        return { max: max, min: min };
    };
    ChartComponent.prototype.getMaxMinTimeline = function (values) {
        var max = Number.MIN_VALUE, min = Number.MAX_VALUE;
        values.data.forEach(function (val) {
            if (val.timestmp > max) {
                max = val.timestmp;
            }
            if (val.timestmp < min) {
                min = val.timestmp;
            }
        });
        return { max: max, min: min };
    };
    ChartComponent.prototype.getDate = function () {
        var res = {};
        var d = new Date();
        var dd = d.getDate();
        var mm = d.getMonth() + 1;
        var yyyy = d.getFullYear();
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
    };
    ChartComponent.prototype.getDay = function (num) {
        var res = {};
        var d = new Date();
        d.setDate(d.getDate() - num);
        var dd = d.getDate();
        var mm = d.getMonth() + 1;
        var yyyy = d.getFullYear();
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
    };
    ChartComponent.prototype.getWeek = function (num) {
        var res = {};
        var d = new Date();
        var day = d.getDay();
        if (day === 0) {
            num++;
        }
        var firstDay = new Date();
        firstDay.setDate(d.getDate() - day - num * 7 + 1);
        var lastDay = new Date();
        if (num > 0) {
            lastDay.setDate(d.getDate() - day - (num - 1) * 7);
        }
        else {
        }
        firstDay.setSeconds(0);
        firstDay.setMinutes(0);
        firstDay.setHours(0);
        res.startTime = firstDay.getTime();
        lastDay.setSeconds(59);
        lastDay.setMinutes(59);
        lastDay.setHours(23);
        res.endTime = lastDay.getTime();
        res.text = ('0' + firstDay.getDate()).slice(-2) + '/' + ('0' + (firstDay.getMonth() + 1)).slice(-2) + '/' + firstDay.getFullYear() +
            ' - ' +
            ('0' + lastDay.getDate()).slice(-2) + '/' + ('0' + (lastDay.getMonth() + 1)).slice(-2) + '/' + lastDay.getFullYear();
        return res;
    };
    ChartComponent.prototype.getMonth = function (num) {
        var res = {};
        var d = new Date();
        var mm = d.getMonth();
        var dd = d.getDate();
        mm = d.getMonth() - parseInt(num);
        var yyyy = d.getFullYear();
        var firstDay = new Date(yyyy, mm, 1);
        var lastDay = new Date(yyyy, mm + 1, 0);
        firstDay.setSeconds(0);
        firstDay.setMinutes(0);
        firstDay.setHours(0);
        res.startTime = firstDay.getTime();
        lastDay.setSeconds(59);
        lastDay.setMinutes(59);
        lastDay.setHours(23);
        res.endTime = lastDay.getTime();
        res.text = ('0' + firstDay.getDate()).slice(-2) + '/' + ('0' + (firstDay.getMonth() + 1)).slice(-2) + '/' + firstDay.getFullYear() +
            ' - ' + ('0' + lastDay.getDate()).slice(-2) + '/' + ('0' + (lastDay.getMonth() + 1)).slice(-2) + '/' + lastDay.getFullYear();
        return res;
    };
    ChartComponent.prototype.getChartColor = function (seed) {
        if (this.theme === widget_interface_1.SiteTheme.dark) {
            return this.darkColor[seed % this.darkColor.length].color;
        }
        else {
            return this.lightColor[seed % this.lightColor.length].color;
        }
    };
    __decorate([
        core_1.Input()
    ], ChartComponent.prototype, "values");
    __decorate([
        core_1.Input()
    ], ChartComponent.prototype, "config");
    ChartComponent = __decorate([
        core_1.Component({
            selector: 'app-chart',
            templateUrl: './chart.component.html',
            styleUrls: ['./chart.component.scss']
        })
    ], ChartComponent);
    return ChartComponent;
}());
exports.ChartComponent = ChartComponent;
var ChartComponentModule = /** @class */ (function () {
    function ChartComponentModule() {
    }
    ChartComponentModule = __decorate([
        core_1.NgModule({
            declarations: [
                ChartComponent,
                pie_chart_component_1.PieChartComponent,
            ],
            imports: [
                angular2_nvd3_1.NvD3Module,
                common_1.CommonModule
            ],
            exports: [
                ChartComponent,
                pie_chart_component_1.PieChartComponent,
            ],
            entryComponents: [ChartComponent, pie_chart_component_1.PieChartComponent]
        })
    ], ChartComponentModule);
    return ChartComponentModule;
}());
exports.ChartComponentModule = ChartComponentModule;
