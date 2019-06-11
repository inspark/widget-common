import {
  ChangeDetectorRef,
  Compiler,
  Component,
  Input,
  NgModule,
  NgModuleFactory,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslateService} from '@ngx-translate/core';
import {Observable} from 'rxjs';
import {FormsModule} from '@angular/forms';
import {
  ChartTypes,
  ItemSingle,
  IWidget,
  IWidgetClass,
  IWidgetParam,
  SiteTheme,
  WidgetParams,
  VALUE_TYPE,
  STATE_COLORS, ITEM_TYPE, ItemParent, WidgetItem
} from "../widget.interface";
import {WidgetPackage} from "../widget.component";
import {CommunicationService} from "../communication.service";
import {DashboardSharedModule} from "../shared.module";
import {assignValues, createParamList} from "../widget.utils";
import {getWidgetPath, updateWidgetMediaUrl} from "../loader";
import {generateValues} from "../widget.generator";
import {sprintf} from "../sprintf";
import {common} from "../common";


export interface WidgetContainerDevOptions {
  widgetPackage: WidgetPackage;
  isDev: boolean;
}


export interface WidgetContainerProduction {
  widget: IWidget;
  widgetPackage: WidgetPackage;
  widgetClass: IWidgetClass;
  params: IWidgetParam[];
  sendData: (param: ItemSingle) => {};
  isDev: boolean;
}


export class WidgetContainer {

  public createComponentModule(componentType: any): any {
    @NgModule({
      imports: [CommonModule, DashboardSharedModule, NgbModule, FormsModule],
      declarations: [
        componentType,
      ],
      entryComponents: [componentType]
    })
    class RuntimeComponentModule {
    }

    // a module for just this Type
    return RuntimeComponentModule;
  }


  public createNewComponent(opts: WidgetContainerDevOptions | WidgetContainerProduction): any {

    @Component({
      selector: 'widget-component',
      template: opts.widgetPackage.template,
      styles: [opts.widgetPackage.styles],
      encapsulation: ViewEncapsulation.Emulated
    })
    class WidgetComponent implements OnInit, OnDestroy {
      component = opts.widgetPackage.component;
      media: any;


      private devOpts: WidgetContainerDevOptions = opts as WidgetContainerDevOptions;
      private prodOpts: WidgetContainerProduction = opts as WidgetContainerProduction;



      readonly pictureId = opts.isDev ? -1 : (this.prodOpts.widget ? this.prodOpts.widget.config.widget.picture.pictureId : null);

      private message$: Observable<any>;

      readonly CHART_TYPES = ChartTypes;
      readonly VALUE_TYPE = VALUE_TYPE;


      set values(data) {
        this._values = data;
      }

      get values() {
        return this._values;
      }

      _values = {};

      randomInterval: any;

      isCompact = false;
      widget: IWidget = this.prodOpts.widget;
      private subscriber: any;

      CHARTS = {
        pie: {
          chart: {
            type: 'pieChart',
            height: 80,
            x: function (d) {
              return d.key;
            },
            y: function (d) {
              return parseFloat(String(d.y / 3600000)).toFixed(2);
            },
            showLabels: false,
            showLegend: false,
            labelType: 'percent',
            donut: false,
            donatRatio: 0.38,
            duration: 500,
            transitionDuration: 500,
            labelThreshold: 0.05,
            labelSunbeamLayout: true,
            margin: {top: 5, right: 5, bottom: 5, left: 5},
            marginTop: null
            // legend: {
            //   margin: {
            //     top: 5,
            //     right: 95,
            //     bottom: 5,
            //     left: 0
            //   }
            // }
          }
        }
      };

      constructor(private communication: CommunicationService, private cdRef: ChangeDetectorRef) {
        if (opts.isDev) {
          this.message$ = communication.message$[0];
          this.message$.subscribe(this.updateData.bind(this));
          this.communication.next(0, {command: 'SUBSCRIBE'});
        } else {
          if (this.prodOpts.widget) {
            this.message$ = communication.message$[this.prodOpts.widget.id];
            this.subscriber = this.message$.subscribe(this.updateData.bind(this));
          }
        }
      }

      ngOnInit() {
        if (opts.isDev) {
          this.media = this.component.media;
        } else {
          if (this.prodOpts.widget) {
            this.values = assignValues(this.prodOpts.widgetPackage.params, this.prodOpts.params, this.prodOpts.widget.config.items);
          } else {
            this.generateValues();
          }
          if (this.prodOpts.widgetClass) {
            const url = getWidgetPath(this.prodOpts.widgetClass);
            this.media = updateWidgetMediaUrl(this.component.media, url);
          }
        }
        this.component.onInit();
      }

      ngOnDestroy() {
        if (opts.isDev) {
          clearInterval(this.randomInterval);

        } else {
          this.cdRef.detach();
          if (this.subscriber) {
            this.subscriber.unsubscribe();
          }
          this.message$ = null;
        }
        if (this.component) {
          this.component.onDestroy();
        }
      }

      private generateValues() {
        this.values = generateValues(this.prodOpts.widgetPackage.params, createParamList(this.prodOpts.widgetPackage.params));
        this.values = this.addChartData(this.values);
        console.log('GENERATE', this.values);
        this.component.onUpdate(this.values);
      }

      private addChartData(values) {
        for (const key in this.prodOpts.widgetPackage.params) {
          if (this.prodOpts.widgetPackage.params.hasOwnProperty(key)) {
            const param = this.prodOpts.widgetPackage.params[key];
            if (param.items instanceof Array) {
              if (param.items[0].item_type === ITEM_TYPE.interval && values[key].items) {
                for (let i = 0; i < values[key].items.length; i++) {
                  const datapie = [];
                  if (values[key].items[i].data.states) {
                    values[key].items[i].data.states.forEach(item => {
                      datapie.push({
                        'key': item.state.name,
                        'y': item.interval,
                        'color': item.state.id > -1 ? STATE_COLORS[item.state.id] : STATE_COLORS[0]
                      });
                    });
                    values[key].items[i].datapie = datapie;
                  }
                }
              }
            }
          }
        }
        return values;
      }


      private updateData(data) {
        if (!data) {
          return;
        }
        if (opts.isDev) {
          if (data.command === 'values') {
            this.values = data.values;
            this.component.onUpdate(this.values);
            console.log('NEW VALUES', this.values);
          }
        } else {
          data.forEach(val => {
            const param: any = this.getParam(val.refName);
            const newVal = {...val};
            if (param.itemType === ITEM_TYPE.series) {
              param.data = val.values;
            } else {
              if (param.viewConfig && param.viewConfig.formatValue) {
                try {
                  const fmlength = (param.viewConfig.formatValue.match(new RegExp('%', 'g')) || []).length;
                  const args = [];
                  for (let i = 0; i < fmlength; i++) {
                    args.push(val.value);
                  }
                  newVal.value = sprintf(param.viewConfig.formatValue, ...args);
                } catch (e) {
                  console.log(e);
                  newVal.value = 'Invalid format string';
                }
              }
              param.data = newVal;
              param.value = newVal.value;
            }
          });
          this.component.onUpdate(this.values);
          this.cdRef.detectChanges();
        }
      }

      private getParam(path: string): WidgetItem {
        const array = path.split('.');
        let res: any = this.values;
        let isTable = false;
        array.forEach(val => {

          if ((res as ItemParent).items) {
            res = res.items[parseInt(val, 10) - 1];
          } else if (res.hasOwnProperty('values')) {
            res = res.values[parseInt(val, 10) - 1];
            isTable = true;
          } else if (isTable) {
            res = res[parseInt(val, 10) - 1];
          } else {
            res = res[val];
          }
        });
        return res;
      }

      /**
       * Заглушка для получения URL
       */
      urlExport(): string {
        if (this.widget) {
          return common.serviceUrl + '/' + 'db/widget' + '/' + this.widget.id + '/export';
        } else {
          return '';
        }
      }

      paramCancel(par: WidgetItem) {
        par.isEditing = false;
      }

      paramEdit(par: WidgetItem) {
        par.isEditing = true;
      }

      paramSave(par: WidgetItem) {
        par.isEditing = false;
      }
    }

    return WidgetComponent;
  }

}
