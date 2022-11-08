import {
  ChartTypes,
  GenerateConfigItem,
  ITEM_TYPE,
  ItemParent,
  ItemTable,
  IWidgetDeviceParamData,
  IWidgetParam,
  IWidgetParamConfig,
  PARAM_TYPE,
  ParamConfigCustom,
  ParamConfigurator,
  SeriesDuration,
  TableValues,
  WidgetArrayParam,
  WidgetItem,
  WidgetItems,
  WidgetParamChildren,
  WidgetParamsChildren,
} from './widget.interface';
import {_} from './widget.component';
import {Pipe, PipeTransform} from '@angular/core';
import {common} from './common';


@Pipe({name: 'filterIndexOf'})
export class FilterIndexOfPipe implements PipeTransform {
  transform(array: any[], field: string, search: any) {
    return array.filter(val => {
      return val[field].indexOf(search) !== -1;
    });
  }
}


@Pipe({name: 'periodFromDate'})
export class PeriodFromDatePipe implements PipeTransform {
  transform(count: number, period: string): string {

    switch (period) {
      case 'now':
        return Utils.getDate();

      case 'day':
        return Utils.getDay(count);

      case 'week':
        return Utils.getWeek(count);

      case 'month':
        return Utils.getMonth(count);
    }

  }
}


@Pipe({name: 'arrayNumber'})
export class ArrayNumberPipe implements PipeTransform {
  transform(value, args: string[] = []): any {
    return Array(value).fill(1).map((x, i) => i + 1);
  }
}

@Pipe({name: 'makePictureUrl'})
export class MakePictureUrl implements PipeTransform {
  transform(id: number): string {
    if (id === -1) {
      return 'data:image/gif;base64,R0lGODlhZABkAIAAAP///ztXpyH/C1hNUCBEYXRhWE1QPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS4zLWMwMTEgNjYuMTQ1NjYxLCAyMDEyLzAyLzA2LTE0OjU2OjI3ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M2IChNYWNpbnRvc2gpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkNCMTBEMjc5NDJCMjExRTlCOTY0Q0MxNURGQkREMDc0IiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkNCMTBEMjdBNDJCMjExRTlCOTY0Q0MxNURGQkREMDc0Ij4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6Q0IxMEQyNzc0MkIyMTFFOUI5NjRDQzE1REZCREQwNzQiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6Q0IxMEQyNzg0MkIyMTFFOUI5NjRDQzE1REZCREQwNzQiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4B//79/Pv6+fj39vX08/Lx8O/u7ezr6uno5+bl5OPi4eDf3t3c29rZ2NfW1dTT0tHQz87NzMvKycjHxsXEw8LBwL++vby7urm4t7a1tLOysbCvrq2sq6qpqKempaSjoqGgn56dnJuamZiXlpWUk5KRkI+OjYyLiomIh4aFhIOCgYB/fn18e3p5eHd2dXRzcnFwb25tbGtqaWhnZmVkY2JhYF9eXVxbWllYV1ZVVFNSUVBPTk1MS0pJSEdGRURDQkFAPz49PDs6OTg3NjU0MzIxMC8uLSwrKikoJyYlJCMiISAfHh0cGxoZGBcWFRQTEhEQDw4NDAsKCQgHBgUEAwIBAAAh+QQAAAAAACwAAAAAZABkAAAC/4SPqcvtD6MLtNqLs968+58Z4EiWpime6sqOaQvH8CvXNkjf+m7l/G/zAYctIfGIAiCXKyPzuXFCpz0l9aqRYqHaLbPrRYLDxDEZaD7z0modux20wrny+bduF+Pz5T0f7fe3FijoRlgYh9inOPTGSOL4iHMoyRJZ2XGJGUW5meSZCCqjKVpVGkN6GpB6ylrqKgoLKutJu2mLiVupK8n76MsIrCiMSFxoLIj8p8zHnOdsBz0nDUfdZq2GfaZNxh3m7QW+JY5FfmVOhT6lTqda1OnOwf40fxffBH8fkq9/Ub/0T0+/TwMh8Su46mDBgEcYLkI4CWJEiR4cNlI40CIgig0VMfaTADKkyJEkDRQAADs=';
    } else {
      return common.serviceUrl + `/db/icon/${id}/img`;
    }
  }
}

@Pipe({name: 'makeIconUrl'})
export class MakeIconUrl implements PipeTransform {
  transform(id: number): string {
    if (id === -1) {
      return '/assets/icon.svg';
    } else {
      return common.serviceUrl + `/db/icon/${id}/img`;
    }
  }
}

/**
 * @deprecated
 */
@Pipe({name: 'makeChartUrl'})
export class MakeChartUrl implements PipeTransform {
  transform(id: number, isCalc, isSignal = false): string {
    return common.transformChartUrlConfig(id, isCalc, isSignal);
  }
}

@Pipe({name: 'chartUrl'})
export class ChartUrl implements PipeTransform {
  transform(param: IWidgetDeviceParamData): string {
    return common.transformChartUrlConfig(param);
  }
}


// Добавляем значения для
export function assignValues(inputValues: WidgetParamsChildren, params: IWidgetParam[], viewConfig: { [k: string]: IWidgetParamConfig }, path = []): ItemParent {


  const result: WidgetItems = {};
  for (const key in inputValues) {
    if (inputValues.hasOwnProperty(key)) {
      const item = inputValues[key];
      const itemPath = [...path, key];
      const refName = itemPath.join('.');
      if (item.items) {
        const param = params.find(val => val.refName === itemPath.join('.'));
        const cfg = getConfig(viewConfig, refName);
        if (item.items instanceof Array) {
          result[key] = {
            items: assignValuesArray(item.items as WidgetArrayParam[], params, viewConfig, itemPath),
            viewConfig: cfg,
            files: cfg.files ? cfg.files : null,
            custom_data: item.custom_data
          } as ItemParent;
        } else {
          result[key] = {
            ...assignValues(item.items as WidgetParamsChildren, params, viewConfig, itemPath),
            viewConfig: cfg,
            files: cfg.files ? cfg.files : null,
            custom_data: item.custom_data
          } as ItemParent;
        }
        if (param && param.config) {
          (result[key] as ItemParent).config = param.config;
        }
      } else {
        result[key] = assignValue(item, itemPath, params, viewConfig);
      }
    }
  }
  return result;
}

export function validateArcherParams(variables) {
  const errors = [];
  const forbiddenNames = ['viewConfig', 'title', 'config', 'files'];

  forbiddenNames.forEach(name => {
    if (variables.find(item => item.name === name)) {
      errors.push(name);
    }
  });
  return errors;
}


function getConfig(viewConfig, refName): IWidgetParamConfig {
  return viewConfig[refName] ? viewConfig[refName] : {};
}

function assignValuesArray(inputValues: WidgetArrayParam[], params: IWidgetParam[], viewConfigs: { [k: string]: IWidgetParamConfig },
                           path = []): WidgetItem[] {
  let result: WidgetItem[] = [];
  const sPath = path.join('.');
  const inputValue = inputValues[0];
  params.forEach(val => {
    const valPath = val.refName.split('.');
    const ind: any = valPath.splice(valPath.length - 1, 1);
    if (valPath.join('.') === sPath) {
      const viewConfig = getConfig(viewConfigs, val.refName);
      if (val.itemType === ITEM_TYPE.custom) {
        let value: any;
        if (inputValue.param_type === PARAM_TYPE.custom_json) {
          try {
            value = JSON.parse((val.config as ParamConfigCustom).value);
          } catch (e) {
            value = {};
          }
        } else {
          value = (val.config as ParamConfigCustom).value;
        }
        result[ind] = {...val, data: null, value, viewConfig};
      } else {
        const value = (val.itemType === ITEM_TYPE.single && val?.device?.param?.value) ? val.device.param.value : null;
        result[ind] = {...val, data: value, value, viewConfig};
      }
    }
  });
  result = result.filter(val => val);
  return result;
}


function assignValue(item: WidgetParamChildren, itemPath, params: IWidgetParam[],
                     viewConfigs: { [k: string]: IWidgetParamConfig }): WidgetItem {
  const path = itemPath.join('.');

  if (item.item_type === ITEM_TYPE.table) {
    const itemValues: TableValues = [];
    let rows = 0, cols = 0;
    const itemTable: IWidgetParam = params.find(param => param.refName === path);
    params.forEach((param: IWidgetParam) => {
      if (param.refName.indexOf(path) === 0) {

        const path = param.refName.split('.');
        const i = parseInt(path[path.length - 2]) - 1;
        const j = parseInt(path[path.length - 1]) - 1;
        if (!itemValues[i]) {
          itemValues[i] = [];
        }
        itemValues[i][j] = {
          ...param,
          data: null,
          value: null,
          custom: {},
          config: {},
          viewConfig: getConfig(viewConfigs, path.join('.')),
          custom_data: item.custom_data,
        };
        if (i > rows) {
          rows = i;
        }
        if (j > cols) {
          cols = j;
        }
      }
    });

    const res: ItemTable = {
      ...itemTable,
      values: itemValues,
      viewConfig: getConfig(viewConfigs, path),
      custom_data: item.custom_data,
    };
    return res;
  } else {
    const param = params.find(val => val.refName === path);
    if (param) {
      const viewConfig = getConfig(viewConfigs, path);
      if (item.item_type === ITEM_TYPE.custom) {
        let value: any;
        if (item.param_type === PARAM_TYPE.custom_json) {
          try {
            value = JSON.parse((param.config as ParamConfigCustom).value);
          } catch (e) {
            value = {};
          }
        } else {
          value = (param.config as ParamConfigCustom).value;
        }
        return {
          ...param,
          data: null,
          value,
          custom_data: item.custom_data,
          viewConfig,
          custom: {}
        };
      } else {
        const value = (param.itemType === ITEM_TYPE.single && param?.device?.param?.value) ? param.device.param.value : null;

        return {
          ...param,
          data: value,
          value,
          custom_data: item.custom_data,
          viewConfig,
          custom: {}
        };
      }
    } else {
      return {data: null};
    }
  }
}

export function clearParams(params: ParamConfigurator[]) {
  for (let i = 0; i < params.length; i++) {
    params[i].value = null;
    if (params[i].items) {
      clearParams(params[i].items);
    }
  }
}

export function findParam(params: ParamConfigurator[], refname: string): ParamConfigurator {
  for (let i = 0; i < params.length; i++) {
    if (params[i].name === refname) {
      return params[i];
    }
    if (params[i].items) {
      const param = findParam(params[i].items, refname);
      if (param) {
        return param;
      }
    }
  }
  return null;
}


// Преобразует  структуру параметров виджета в структуру для конфигуратора
export function createParamList(params: WidgetParamsChildren | WidgetArrayParam[], itemType = ITEM_TYPE.single,
                                paramType: PARAM_TYPE = PARAM_TYPE.value, path = [], parent = null): ParamConfigurator[] {
  const result: ParamConfigurator[] = [];

  if (params instanceof Array) {
    // Элемент масссива
    const item: any = params[0];
    const itemPath = [...path, 1];
    itemType = item.item_type || itemType;
    paramType = item.param_type || paramType;
    result.push({
      name: itemPath.join('.'),
      title: 'Item 1',
      views: item.views,
      itemType,
      paramType,
      parent,
      config: null,
      generateConfig: {count: 3, param: true, data: true},
      param: params[0] as WidgetParamChildren,
    });
  } else {
    for (const key in params) {
      if (params.hasOwnProperty(key)) {
        const item = params[key];
        itemType = item.item_type || itemType;
        paramType = item.param_type || paramType;
        const itemPath = [...path, key];

        if (params[key].items) {
          // Массив
          let config: any = {};
          if (ITEM_TYPE.series === itemType) {
            config = {count: 0, charttype: ChartTypes.lineChart, duration: SeriesDuration.day};
          }
          const res: ParamConfigurator = {
            name: itemPath.join('.'),
            title: _(item.title),
            itemType,
            paramType,
            parent,
            views: item.views,
            config,
            generateConfig: {count: 3, param: true, data: true},
            param: params[key],
          };
          res.items = createParamList(params[key].items, itemType, paramType, itemPath, res);
          if (params[key].items instanceof Array) {
            res.isArray = true;
            if (params[key].items[0].max) {
              res.maxItems = params[key].items[0].max;
            }
          }
          result.push(res);
        } else {
          // Таблица
          if (itemType === ITEM_TYPE.table) {
            result.push({
              name: itemPath.join('.'),
              views: item.views,
              title: item.title,
              itemType,
              paramType,
              parent,
              param: params[key],
              viewConfig: {
                rows: 1,
                cols: 1,
                colsName: ['Col 1'],
                rowsName: ['Row 1'],
                visibleRow: true,
                visibleCol: true
              },
              config: {},
              generateConfig: {
                data: true,
                param: true,
                rows: 2,
                columns: 2,
                visibleCol: true,
                visibleRow: true,
              }
            });
          } else {
            // Простой элемент

            let config: any = {};
            if (ITEM_TYPE.series === itemType) {
              config = {count: 0, charttype: ChartTypes.lineChart, duration: SeriesDuration.day};
            }
            result.push({
              name: itemPath.join('.'),
              title: item.title,
              views: item.views,
              itemType,
              paramType,
              parent,
              config,
              param: params[key],
              generateConfig: {data: true, param: true}
            });
          }
        }
      }
    }
  }
  return result;
}

export function createGenerateItemConfig(): GenerateConfigItem {
  return {
    pageLink: false,
    isOnline: true,
    data: true,
    param: true,
    borders: false,
    editable: false,
    paragraphCount: 1,
    isWorkingDevice: true,
    title: 'Title param',
    ctrability: true,
    archer: {}
  };
}

export function addArrayItem(parent: ParamConfigurator) {
  parent.items.push({
    name: [parent.name, parent.items.length + 1].join('.'),
    title: `Item ${parent.items.length + 1}`,
    itemType: parent.itemType,
    paramType: parent.paramType,
    parent: parent,
    config: {}
  });
}

export function convertArcherToItem(item, param): ParamConfigurator {
  return {
    name: (param.name || param.refName) + '.' + item.name,
    title: item.title ? item.title : item.name,
    itemType: ITEM_TYPE.single,
    paramType: PARAM_TYPE.value,
    parent: param,
    config: {},
    generateConfig: {
      count: 3, param: true, data: true
    }
  };
}


export function prepareExternalJSON(json) {
  for (const k in json) {
    if (json.hasOwnProperty(k)) {
      if (json[k].item_type && typeof json[k].item_type === 'string') {
        json[k].item_type = ITEM_TYPE[json[k].item_type];
      }
      if (json[k].param_type && typeof json[k].param_type === 'string') {
        json[k].param_type = PARAM_TYPE[json[k].param_type];
      }
      if (json[k].items) {
        json[k].items = prepareExternalJSON(json[k].items);
      }
    }
  }
  return json;
}


export class Utils {


  public static getDate(ts: number = Date.now()) {
    const d = new Date(ts);
    const dd = d.getDate();
    const mm = d.getMonth() + 1;
    const yyyy = d.getFullYear();
    return ('0' + dd).slice(-2) + '/' + ('0' + mm).slice(-2) + '/' + yyyy;
  }

  public static getDay(num: number) {
    const d = new Date();
    d.setDate(d.getDate() - num);
    const dd = d.getDate();
    const mm = d.getMonth() + 1;
    const yyyy = d.getFullYear();
    return ('0' + dd).slice(-2) + '/' + ('0' + mm).slice(-2) + '/' + yyyy;
  }

  public static getWeek(num: number) {
    const d = new Date();
    const day = d.getDay();
    if (day === 0) {
      num++;
    }
    const firstDay: any = new Date();
    firstDay.setDate(d.getDate() - day - num * 7 + 1);
    const lastDay: any = new Date();
    if (num > 0) {
      lastDay.setDate(d.getDate() - day - (num - 1) * 7);
    }
    return ('0' + firstDay.getDate()).slice(-2) + '/' + ('0' + (firstDay.getMonth() + 1)).slice(-2) + '/' + firstDay.getFullYear() + ' - ' +
      ('0' + lastDay.getDate()).slice(-2) + '/' + ('0' + (lastDay.getMonth() + 1)).slice(-2) + '/' + lastDay.getFullYear();
  }


  public static getMonth(num: number) {
    const d: any = new Date();
    d.setMonth(d.getMonth() - num);
    const dd: any = d.getDate();
    const mm: any = d.getMonth();
    const yyyy: any = d.getFullYear();

    const firstDay: any = new Date(yyyy, mm, 1);
    const lastDay: any = new Date(yyyy, mm + 1, 0);
    return ('0' + firstDay.getDate()).slice(-2) + '/' + ('0' + (firstDay.getMonth() + 1)).slice(-2) + '/' + firstDay.getFullYear() + ' - ' +
      ('0' + lastDay.getDate()).slice(-2) + '/' + ('0' + (lastDay.getMonth() + 1)).slice(-2) + '/' + lastDay.getFullYear();
  }


  public static getTime(ts: number) {
    let d;
    if (typeof ts === 'undefined') {
      d = new Date();
    } else {
      d = new Date(ts);
    }
    const hh = d.getHours();
    const mm = d.getMinutes();
    const ss = d.getSeconds();
    return ('0' + hh).slice(-2) + ':' + ('0' + mm).slice(-2);
  }


}
