import {
  Border,
  ChartViews,
  ChartViewToType,
  EventValues,
  GenerateConfigItem, IColConfig, IRowConfig,
  ITEM_TYPE,
  ItemCustom,
  ItemInterval,
  ItemSeries,
  ItemSingle,
  ItemSysInfo,
  ItemTable,
  IWidget,
  LineType,
  ObjStateValues,
  PARAM_STATE_INT,
  PARAM_TYPE,
  ParamConfigSeries,
  ParamConfigurator,
  SeriesDuration,
  VALUE_TYPE,
  WidgetItem,
  WidgetParamChildren,
  WidgetParamsChildren
} from './widget.interface';
import {findParam} from './widget.utils';

export function generateValues(inputValues: WidgetParamsChildren | WidgetParamsChildren[] | WidgetParamChildren[],
                               params: ParamConfigurator[],
                               itemType = ITEM_TYPE.single, paramType = PARAM_TYPE.value, path = []): WidgetItem[] {
  if (inputValues instanceof Array) {
    // Проходимся по массив
    const result: WidgetItem[] = [];
    const conf: any = inputValues[0];
    itemType = conf.item_type !== undefined ? conf.item_type : itemType;
    paramType = conf.param_type !== undefined ? conf.param_type : paramType;
    const param = findParam(params, path.join('.'));
    const max = Math.min(param.generateConfig?.count || 3, conf.max || 10);
    for (let i = 0; i < max; i++) {

      if (paramType === PARAM_TYPE.virtual_object) {
        const itemPath = [...path, 1];
        result.push(generateValues(conf, params, itemType, paramType, itemPath));
      } else {
        result.push(generateValue(i, conf, paramType, itemType, param));
      }
    }
    return result;
  } else {
    // Проходимся по объекту
    const result: any = {};
    for (const key in inputValues) {
      if (inputValues.hasOwnProperty(key)) {
        const itemPath = [...path, key];
        const param = findParam(params, itemPath.join('.'));
        const item = inputValues[key];
        itemType = item.item_type || itemType;
        paramType = item.param_type || paramType;
        if (inputValues[key].items) {
          if (inputValues[key].items instanceof Array) {
            // Если элемент - массив
            result[key] = {
              items: generateValues(inputValues[key].items, params, itemType, paramType, itemPath),
              config: generateParamConfig(itemType, param),
              viewConfig: {...(param.param ? param.param.viewConfig : {})},
              custom_data: inputValues[key].custom_data
            };
          } else {
            // Если элемент - объект
            result[key] = {
              ...generateValues(inputValues[key].items, params, itemType, paramType, itemPath),
              config: generateParamConfig(itemType, param),
              viewConfig: {...(param.param ? param.param.viewConfig : {})},
              custom_data: inputValues[key].custom_data
            };
          }
        } else {
          // Если элемент - простой
          result[key] = generateValue(0, item, paramType, itemType, param);
        }
      }
    }
    return result;

  }
}


function generateParamConfig<T>(itemType: ITEM_TYPE, param: ParamConfigurator, paramType: PARAM_TYPE = null)
  : T {
  switch (itemType) {
    case ITEM_TYPE.custom:
      return {
        type: paramType,
        value: 'text'
      } as any;
    case ITEM_TYPE.interval:
      return {
        dailyRange: 'dailyRange',
        stateMap: false,
        valueType: VALUE_TYPE.absolute,
        duration: SeriesDuration.day,
        count: 1,
      } as any;

    case ITEM_TYPE.single:
      return {
        valueType: VALUE_TYPE.absolute,
      } as any;

    case ITEM_TYPE.series:
      const config = param.config as ParamConfigSeries;
      return {
        charttype: ChartViewToType[(config && config.viewtype) ? config.viewtype : ChartViews.lineChart],
        viewtype: (config && config.viewtype) ? config.viewtype : ChartViews.lineChart,
        duration: SeriesDuration.week,
        count: 0,
        generator: true
      } as any;
    case ITEM_TYPE.events:
      return {
        lineType: LineType.eventlog,
        attrList: ['shortname', 'serialnumber', 'eventid', 'name', 'timestmp', 'msg'],
        titleList: ['Short name', 'Serial number', 'Event', 'Full name', 'Time', 'Message'],
        size: 10
      } as any;

  }

}

function generateValue(index: number, item: WidgetParamChildren, paramType: PARAM_TYPE, itemType: ITEM_TYPE, param: ParamConfigurator): WidgetItem {
  let res;
  switch (itemType) {
    case ITEM_TYPE.series:
      res = generateSeriesParam(index, paramType, item, param);
      break;
    case ITEM_TYPE.single:
      res = generateSingleParams(index, paramType, item, param);
      break;
    case ITEM_TYPE.table:
      res = generateTableParams(index, paramType, item, param);
      break;
    case ITEM_TYPE.events:
      res = generateEventsParams(index, paramType, item, param);
      break;
    case ITEM_TYPE.objstate:
      res = generateObjStateParams(index, paramType, item, param);
      break;
    case ITEM_TYPE.custom:
      if (paramType === PARAM_TYPE.custom_external) {
        res = generateSingleParams(index, paramType, item, param);
      } else {
        res = generateCustomParams(index, paramType, item, param);
      }
      break;
    case ITEM_TYPE.interval:
      res = generateIntervalParams(index, paramType, item, param);
      break;
    case ITEM_TYPE.sysinfo:
      res = generateSysInfoParam(index, paramType, item, param);
      break;
  }
  if (item.custom_data) {
    res.custom_data = res;
  }
  return res;
}

function updateValue(value) {

  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  } else {
    return value;
  }
}

function getRandomValue(paramType: PARAM_TYPE, item: WidgetParamChildren) {

  if (item.available) {
    return item.available[getRandom(0, item.available.length)];
  } else {
    if (paramType !== PARAM_TYPE.signal) {
      return getRandom(10, 999);
    } else {
      return getRandom(0, 1);
    }
  }
}


function getIconSet(needIcons: boolean) {
  if (!needIcons) {
    return null;
  }
  return {
    error: '',
    falsevalue: '',
    none: '',
    success: '',
    warning: '',
  };
}

function generateSingleParams(index: number, paramType: PARAM_TYPE, item: WidgetParamChildren, param: any): ItemSingle {

  const config = getConfig(param, index);
  const value = (config.value === undefined || config.value === '') ? getRandomValue(paramType, item) : updateValue(config.value);
  return {
    device: config.param ? {
      controller: {id: null, serialnumber: 'SN' + getRandom(10000, 99999), isOnline: config.isOnline},
      object: {
        id: null,
        shortname: 'Object ' + getRandom(10000, 99999),
        fullname: 'Object ' + getRandom(10000, 99999),
        timezone: 3,
        latitude: 0,
        longitude: 0
      },
      isWorking: config.isWorkingDevice,
      param: {
        id: null,
        name: 'deviceParam name',
        measure: {unit: generateMeasureUnit(), title: 'Электричество', id: getRandom(10000, 99999)},
        type: PARAM_TYPE.value,
        calc: false,
        ctrability: config.ctrability,
      },
      state: (config.isWorkingDevice ? {
        comment: 'Состояние канала устройства: работоспособен',
        id: 1,
        name: 'работоспособен'
      } : {
        comment: 'Состояние канала устройства: неработоспособен',
        id: -1,
        name: 'неработоспособен'
      }),
      zone: {name: 'tagInfo zone'},
    } : null,
    refName: '',
    itemType: ITEM_TYPE.single,
    widgetId: null,
    title: config.title !== null ? config.title : 'Title param',
    config: generateParamConfig(ITEM_TYPE.single, param),
    value: config.data ? value : null,
    viewConfig: {view: config.view, ...(param.param ? (param.param as ParamConfigurator).viewConfig : {})},
    data: config.data ? {
      date: 1548968400000,
      value: value,
      locked: config.locked,
      manually: config.editable,
      unit: {id: 2, available: true, name: '', unavailabilityDate: 0},
      state: config.state ? {
        color: PARAM_STATE_INT[config.state],
        comment: 'comment',
        idIcon: config.isIcon ? -1 : 0,
      } : null,
    } : null,
    dashboardLink: config.pageLink ? {dashname: 'Test dashname', id: 2} : null,
    custom: {},
    canEditable: config.editable,
    borders: config.borders ? BORDERS : [],
    icons: getIconSet(config.iconSet),
    isEditing: false,
  };
}


function generateSeriesParam(index: number, paramType: PARAM_TYPE, item: WidgetParamChildren, param: ParamConfigurator): ItemSeries {

  const value = getRandomValue(paramType, item);
  return {
    device: {
      controller: {id: null, serialnumber: 'SN' + getRandom(10000, 99999)},
      object: {
        id: null,
        shortname: 'Object ' + getRandom(10000, 99999),
        fullname: 'Object ' + getRandom(10000, 99999),
        timezone: -3,
        latitude: 0,
        longitude: 0
      },
      param: {
        id: null,
        name: 'deviceParam name',
        measure: {unit: generateMeasureUnit(), title: 'Электричество', id: getRandom(10000, 99999)},
        type: PARAM_TYPE.value,
        calc: false,
      },
      zone: {name: 'tagInfo zone'},
    },
    refName: '',
    itemType: ITEM_TYPE.single,
    widgetId: null,
    title: 'Title param',
    config: {...generateParamConfig(ITEM_TYPE.series, param), ...param.config},
    value,
    viewConfig: null,
    data: (param.config && (param.config as ParamConfigSeries).viewtype === ChartViews.candlestickBarChart) ? CANDLE_CHART : generateChartValues(),
    custom: {},
    borders: [],
    isEditing: false,
  };

}


function generateChartValues() {
  const rand = Math.round(Math.random() * 100);
  return CHART_VALUES.map(val => {
    return {timestmp: val.timestmp, value: val.value + rand};
  });
}

function generateIntervalParams(index: number, paramType: PARAM_TYPE, item: WidgetParamChildren, param: ParamConfigurator): ItemInterval {
  const config = getConfig(param, index);
  const value = (config.value === undefined || config.value === '') ? getRandomValue(paramType, item) : updateValue(config.value);
  return {
    device: {
      controller: {id: null, serialnumber: 'SN' + getRandom(10000, 99999)},
      object: {
        id: null,
        shortname: 'Object ' + getRandom(10000, 99999),
        fullname: 'Object ' + getRandom(10000, 99999),
        timezone: 3,
        latitude: 0,
        longitude: 0
      },
      param: {
        id: null,
        name: 'deviceParam name',
        measure: {unit: generateMeasureUnit(), title: 'Электричество', id: getRandom(10000, 99999)},
        type: PARAM_TYPE.value,
        calc: false,
        ctrability: config.ctrability,
      },
      zone: {name: 'tagInfo zone'},
    },
    refName: '',
    itemType: ITEM_TYPE.single,
    widgetId: null,
    title: config.title !== null ? config.title : 'Title param',
    config: generateParamConfig(ITEM_TYPE.single, param),
    value,
    viewConfig: null,
    data: config.data ? {
      states: [{
        'interval': 21602841,
        'state': {'id': 3, 'name': 'критическое', 'color': 'error', 'comment': 'Критическое значение параметра'}
      }, {
        'interval': 42698374,
        'state': {
          'id': 2,
          'name': 'отклонение',
          'color': 'warning',
          'comment': 'Значение параметра отклонилось от нормального'
        }
      }, {
        'interval': 21414971,
        'state': {'id': 1, 'name': 'норма', 'color': 'success', 'comment': 'Нормальное значение параметра'}
      }, {
        'interval': 18053,
        'state': {'id': 0, 'name': 'нет контроля', 'color': 'none', 'comment': 'Значение параметра не контролируется'}
      }], //  absolute signal
      switchCount: 1, // signal
      value,
      percent: 1, //  relative и increment
      min: 1, //  absolute
      max: 1, //  absolute
      state: config.state ? {
        color: PARAM_STATE_INT[config.state],
        comment: 'comment',
        idIcon: config.isIcon ? -1 : 0,
      } : null,
      'beginInterval': 1556658000000,
      'endInterval': 1557139222542,
      valueMap: [{interval: -84606254, value: 0}, {interval: 1806254, value: 1}],
    } : null,
    custom: {},
    borders: config.borders ? BORDERS : [],
    isEditing: false,
  };

}

function generateEventsParams(index: number, paramType: PARAM_TYPE, item: WidgetParamChildren, param: ParamConfigurator): EventValues {

  const getEvent = () => {
    return {
      'id': Math.round(Math.random() * 100000),
      'shortname': 'БЕЛКА',
      'serialnumber': 'SQUIRREL',
      'eventid': Math.round(Math.random() * 100000),
      'name': '0pus334',
      'timestmp': 1694157120464,
      'paramname': null,
      'paramvalue': null,
      'msg': '0pus334',
      'cdpid': null,
      'ccpid': null,
      'categoryid': null,
      'media': [],
      'criticalId': 4,
      'criticalName': 'success',
      'closeTime': 1694157120464,
      'closed': Math.random() > 0.5,
      'processed': Math.random() > 0.5,
      'value': null
    };
  };
  const rowList: any[] = [];

  if (param.generateConfig.duration) {
    for (let i = 0; i < getRandom(6, 30); i++) {
      rowList.push(getEvent());
    }
  } else {
    for (let i = 0; i < (param.generateConfig.count ?? 20); i++) {
      rowList.push(getEvent());
    }
  }

  return {
    data: {rowList},
    config: {attrList: ['shortname', 'serialnumber', 'msg'], titleList: ['Объект', 'Сер.номер', 'Сообщение']}
  };
}

function generateObjStateParams(index: number, paramType: PARAM_TYPE, item: WidgetParamChildren, param: ParamConfigurator): ObjStateValues {
  return {
    config: {rubricId: 1},
    data: {
      date: 1697487855625,
      states: [
        {
          count: 5,
          id: 3,
          name: 'активен',
        },
        {
          count: 25,
          id: 2,
          name: 'не работает',
        }
      ]
    }
  };
}

function generateCustomParams(index: number, paramType: PARAM_TYPE, item: WidgetParamChildren, param: ParamConfigurator): ItemCustom {
  const config = getConfig(param, index);
  if (paramType === PARAM_TYPE.custom_string) {
    const defValue = BIG_TEXT.slice(0, Math.min(config.paragraphCount || 2, 5)).join('\n');
    return {
      device: null,
      refName: '',
      itemType: ITEM_TYPE.custom,
      widgetId: null,
      title: config.title !== null ? config.title : 'Title param',
      config: generateParamConfig(ITEM_TYPE.custom, param, paramType),
      value: config.value ? config.value : defValue,
      viewConfig: {},
      dashboardLink: config.pageLink ? {dashname: 'Test dashname', id: 2} : null,
      custom: {},
      canEditable: config.editable,
      isEditing: false,
    };
  }

  if (paramType === PARAM_TYPE.custom_objstate) {
    const defValue = 3;
    return {
      device: null,
      refName: '',
      itemType: ITEM_TYPE.custom,
      widgetId: null,
      title: config.title !== null ? config.title : 'Title param',
      config: generateParamConfig(ITEM_TYPE.custom, param, paramType),
      value: config.value ? config.value : defValue,
      viewConfig: {},
      dashboardLink: config.pageLink ? {dashname: 'Test dashname', id: 2} : null,
      custom: {},
      canEditable: config.editable,
      isEditing: false,
    };
  }

  if (paramType === PARAM_TYPE.custom_forge) {
    return {
      device: null,
      refName: '',
      itemType: ITEM_TYPE.custom,
      widgetId: null,
      title: config.title !== null ? config.title : 'Title param',
      config: generateParamConfig(ITEM_TYPE.custom, param, paramType),
      value: config.value ? config.value : '',
      viewConfig: {},
      dashboardLink: config.pageLink ? {dashname: 'Test dashname', id: 2} : null,
      custom: {},
      canEditable: config.editable,
      isEditing: false,
    };
  }
  if (paramType === PARAM_TYPE.custom_json) {

    const defValue = undefined;
    let json_value: any;
    try {
      json_value = config.value ? JSON.parse(config.value) : defValue;
    } catch (e) {

    }
    return {
      device: null,
      refName: '',
      itemType: ITEM_TYPE.custom,
      widgetId: null,
      title: config.title !== null ? config.title : 'Title param',
      config: generateParamConfig(ITEM_TYPE.custom, param, paramType),
      value: json_value,
      viewConfig: {},
      dashboardLink: config.pageLink ? {dashname: 'Test dashname', id: 2} : null,
      custom: {},
      canEditable: config.editable,
      isEditing: false,
    };
  }
  if (paramType === PARAM_TYPE.custom_archer) {
    const res = {
      files: config.files ? {json: config.files.json, svg: config.files.svg} : null,
      value: (config.archer && config.archer.value) ? config.archer.value : null,
      viewConfig: {},
    };

    if (config.archer) {
      for (const key in config.archer) {
        if (config.archer.hasOwnProperty(key)) {
          res[key] = config.archer[key];
        }
      }
    }

    return res as any;
  }
  if (paramType === PARAM_TYPE.custom_file) {
    const res = {
      files: config.files,
      value: null,
      viewConfig: {},
    };

    return res as any;
  }

  if (paramType === PARAM_TYPE.custom_select) {
    const defValue = null;
    return {
      device: null,
      refName: '',
      itemType: ITEM_TYPE.custom,
      widgetId: null,
      title: config.title !== null ? config.title : 'Title param',
      config: generateParamConfig(ITEM_TYPE.custom, param, paramType),
      value: item.custom_data.items.find(val => val.value === config.selectValue),
      viewConfig: {},
      dashboardLink: config.pageLink ? {dashname: 'Test dashname', id: 2} : null,
      custom: {},
      canEditable: config.editable,
      isEditing: false,
    };
  }

  if (paramType === PARAM_TYPE.custom_dashboard) {
    const widgets: IWidget[] = [
      {
        title: 'Widget 1',
        dashboard: {
          id: 1,
          dashname: 'Dash 1',
        },
        widgetclass: {
          id: 1,
          name: 'text',
          storeId: 'text',
        }
      },
      {
        title: 'Widget 2',
        dashboard: {
          id: 1,
          dashname: 'Dash 1',
        },
        widgetclass: {
          id: 1,
          name: 'text',
          storeId: 'text',
        }
      },
      {
        title: 'Widget 3',
        dashboard: {
          id: 1,
          dashname: 'Dash 1',
        },
        widgetclass: {
          id: 1,
          name: 'text',
          storeId: 'text',
        }
      },
    ];
    return {
      device: null,
      refName: '',
      itemType: ITEM_TYPE.custom,
      widgetId: null,
      title: config.title !== null ? config.title : 'Title param',
      config: generateParamConfig(ITEM_TYPE.custom, param, paramType),
      value: widgets,
      viewConfig: {},
      dashboardLink: config.pageLink ? {dashname: 'Test dashname', id: 2} : null,
      custom: {},
    };
  }
}

function generateTableParams(index: number, paramType: PARAM_TYPE, item: WidgetParamChildren, param: ParamConfigurator): ItemTable {


  const values = [];


  for (let i = 0; i < param.generateConfig.rows; i++) {
    values[i] = [];
    for (let j = 0; j < param.generateConfig.columns; j++) {
      // if (Math.random() < 0.9) {
      values[i][j] = generateSingleParams(index, paramType, item, param);
      // } else {
      //   values[i][j] = null;
      // }
    }
  }

  const colConfig: IColConfig[] = [];

  const rowConfig: IRowConfig[] = [];
  for (let i = 1; i <= param.generateConfig.rows; i++) {
    rowConfig.push({name: `Row ${i}`});
  }
  for (let i = 0; i <= param.generateConfig.columns; i++) {
    colConfig.push(getRandomCol());
  }

  return {
    device: null,
    refName: '',
    itemType: ITEM_TYPE.single,
    widgetId: null,
    title: 'Title param',
    config: {},
    values,
    viewConfig: {
      rowsName: ['row 1', 'row 2'],
      colsName: ['col 1', 'col 2'],
      cols: param.generateConfig.columns,
      rows: param.generateConfig.rows,
      visibleRow: param.generateConfig.visibleRow,
      visibleCol: param.generateConfig.visibleCol,
      view: param.generateConfig.view,
      table: {
        cols: param.generateConfig.columns,
        rows: param.generateConfig.rows,
        visibleRow: param.generateConfig.visibleRow,
        visibleCol: param.generateConfig.visibleCol,
        colConfig,
        rowConfig,
      }
    },
    custom: {},
    borders: [],
    isEditing: false,
  };
}

function getRandomCol(hasLabel = true): IColConfig {
  const rnd = Math.random();

  if (rnd <= .25) {
    return {name: hasLabel ? 'Col Fit' : undefined, widthType: 'fit-content'};
  } else if (rnd <= .5) {
    return {name: hasLabel ? 'Col Auto' : undefined, widthType: 'auto'};
  } else if (rnd <= .8) {
    return {name: hasLabel ? 'Col Fix Px100' : undefined, widthType: 'fix', size: {unit: 'px', value: 100}};
  } else {
    return {name: hasLabel ? 'Col Fix %20' : undefined, widthType: 'fix', size: {unit: '%', value: 20}};
  }
}

function generateSysInfoParam(index: number, paramType: PARAM_TYPE, item: WidgetParamChildren, param: ParamConfigurator): ItemSysInfo {
  return {
    id: 1,
    device: null,
    refName: '',
    itemType: ITEM_TYPE.sysinfo,
    widgetId: null,
    title: 'Title param',
    config: {rubricId: 1174},
    data: {
      controllersInfo: {total: getRandom(0, 10), online: getRandom(0, 10), offline: getRandom(0, 10)},
      date: Date.now()
    }
  };
}

function generateMeasureUnit() {
  const units = ['град', '°C', 'лит', 'км', '%'];
  return units[getRandom(0, units.length - 1)];
}

// Возвращает случайное число между min (включительно) и max (включительно)
export function getRandom(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}

function getConfig(param, index): GenerateConfigItem {
  if (param?.generateConfig?.items) {
    return param.generateConfig.items[index] || {};
  }
  return param?.generateConfig ?? {};
}

const BORDERS: Border[] = [{
  'state': {
    'id': 3,
    'name': 'критическое',
    'color': 'error',
    'comment': 'Критическое значение параметра'
  }, 'intervals': [{'from': 70.0, 'to': null}]
}, {
  'state': {
    'id': 2,
    'name': 'отклонение',
    'color': 'warning',
    'comment': 'Значение параметра отклонилось от нормального'
  }, 'intervals': [{'from': 30.0, 'to': 70.0}]
}, {
  'state': {'id': 1, 'name': 'норма', 'color': 'success', 'comment': 'Нормальное значение параметра'},
  'intervals': [{'from': 0.0, 'to': 30.0}]
}, {
  'state': {
    'id': 0,
    'name': 'нет контроля',
    'color': 'none',
    'comment': 'Значение параметра не контролируется'
  }, 'intervals': [{'from': -20.0, 'to': 0.0}]
}, {
  'state': {
    'id': -1,
    'name': 'недостоверно',
    'color': 'falsevalue',
    'comment': 'Недостоверное значение параметра'
  }, 'intervals': [{'from': null, 'to': -20.0}]
}];

const CHART_VALUES = [
  {
    'timestmp': 1645551000000,
    'value': null
  },
  {
    'timestmp': 1645552800000,
    'value': 32.8258476
  },
  {
    'timestmp': 1645554600000,
    'value': 48.659893
  },
  {
    'timestmp': 1645556400000,
    'value': 50.5622482
  },
  {
    'timestmp': 1645558200000,
    'value': 51.6553383
  },
  {
    'timestmp': 1645560000000,
    'value': 50.4319
  },
  {
    'timestmp': 1645561800000,
    'value': 53.0366707
  },
  {
    'timestmp': 1645563600000,
    'value': 47.8176422
  },
  {
    'timestmp': 1645565400000,
    'value': 51.6424713
  },
  {
    'timestmp': 1645567200000,
    'value': 51.812233
  },
  {
    'timestmp': 1645569000000,
    'value': 47.3627434
  },
  {
    'timestmp': 1645570800000,
    'value': 51.7313538
  },
  {
    'timestmp': 1645572600000,
    'value': 49.4223938
  },
  {
    'timestmp': 1645574400000,
    'value': 52.5739746
  },
  {
    'timestmp': 1645576200000,
    'value': 51.6155472
  },
  {
    'timestmp': 1645578000000,
    'value': 49.1932793
  },
  {
    'timestmp': 1645579800000,
    'value': 51.5943527
  },
  {
    'timestmp': 1645581600000,
    'value': 50.5669518
  },
  {
    'timestmp': 1645583400000,
    'value': 48.7359962
  },
  {
    'timestmp': 1645585200000,
    'value': 53.4266319
  },
  {
    'timestmp': 1645587000000,
    'value': 50.285614
  },
  {
    'timestmp': 1645588800000,
    'value': 49.249176
  },
  {
    'timestmp': 1645590600000,
    'value': 50.412838
  },
  {
    'timestmp': 1645592400000,
    'value': 50.2692413
  },
  {
    'timestmp': 1645594200000,
    'value': 52.9794044
  },
  {
    'timestmp': 1645596000000,
    'value': 49.6678772
  },
  {
    'timestmp': 1645597800000,
    'value': 49.4464493
  },
  {
    'timestmp': 1645599600000,
    'value': 52.1587296
  },
  {
    'timestmp': 1645601400000,
    'value': 49.9102745
  },
  {
    'timestmp': 1645603200000,
    'value': 51.7093391
  },
  {
    'timestmp': 1645605000000,
    'value': 51.2751236
  },
  {
    'timestmp': 1645606800000,
    'value': 48.9914932
  },
  {
    'timestmp': 1645608600000,
    'value': 51.0573616
  },
  {
    'timestmp': 1645610400000,
    'value': 51.5929947
  },
  {
    'timestmp': 1645612200000,
    'value': 50.5275879
  },
  {
    'timestmp': 1645614000000,
    'value': 52.7304688
  },
  {
    'timestmp': 1645615800000,
    'value': 48.162323
  },
  {
    'timestmp': 1645617600000,
    'value': 52.0599556
  },
  {
    'timestmp': 1645619400000,
    'value': 49.9631157
  },
  {
    'timestmp': 1645621200000,
    'value': 48.4315491
  },
  {
    'timestmp': 1645623000000,
    'value': 53.9735832
  },
  {
    'timestmp': 1645624800000,
    'value': 47.5742874
  },
  {
    'timestmp': 1645626600000,
    'value': 48.5623856
  },
  {
    'timestmp': 1645628400000,
    'value': 52.1424675
  },
  {
    'timestmp': 1645630200000,
    'value': 48.3597183
  },
  {
    'timestmp': 1645632000000,
    'value': 50.9834785
  },
  {
    'timestmp': 1645633800000,
    'value': 51.0054741
  },
  {
    'timestmp': 1645635600000,
    'value': 48.7688789
  },
  {
    'timestmp': 1645637400000,
    'value': 51.7769661
  },
  {
    'timestmp': 1645639200000,
    'value': 49.1443024
  },
  {
    'timestmp': 1645641000000,
    'value': 51.7417603
  },
  {
    'timestmp': 1645642800000,
    'value': 49.8708458
  },
  {
    'timestmp': 1645644600000,
    'value': 48.1264877
  },
  {
    'timestmp': 1645646400000,
    'value': 51.6495094
  },
  {
    'timestmp': 1645648200000,
    'value': 50.5347023
  },
  {
    'timestmp': 1645650000000,
    'value': 49.7064209
  },
  {
    'timestmp': 1645651800000,
    'value': 52.7749977
  },
  {
    'timestmp': 1645653600000,
    'value': 49.4221077
  },
  {
    'timestmp': 1645655400000,
    'value': 52.6562157
  },
  {
    'timestmp': 1645657200000,
    'value': 51.1348381
  },
  {
    'timestmp': 1645659000000,
    'value': 50.4315948
  },
  {
    'timestmp': 1645660800000,
    'value': 52.5681114
  },
  {
    'timestmp': 1645662600000,
    'value': 48.9252357
  },
  {
    'timestmp': 1645664400000,
    'value': 50.894516
  },
  {
    'timestmp': 1645666200000,
    'value': 51.7634201
  },
  {
    'timestmp': 1645668000000,
    'value': 51.0939255
  },
  {
    'timestmp': 1645669800000,
    'value': 53.2192345
  },
  {
    'timestmp': 1645671600000,
    'value': 51.7018623
  },
  {
    'timestmp': 1645673400000,
    'value': 50.0135651
  },
  {
    'timestmp': 1645675200000,
    'value': 51.3010292
  },
  {
    'timestmp': 1645677000000,
    'value': 46.5560951
  },
  {
    'timestmp': 1645678800000,
    'value': 52.3065147
  },
  {
    'timestmp': 1645680600000,
    'value': 49.7032089
  },
  {
    'timestmp': 1645682400000,
    'value': 48.5279617
  },
  {
    'timestmp': 1645684200000,
    'value': 52.1763
  },
  {
    'timestmp': 1645686000000,
    'value': 48.1455116
  },
  {
    'timestmp': 1645687800000,
    'value': 51.1893082
  },
  {
    'timestmp': 1645689600000,
    'value': 51.143837
  },
  {
    'timestmp': 1645691400000,
    'value': 48.4687042
  },
  {
    'timestmp': 1645693200000,
    'value': 51.5306282
  },
  {
    'timestmp': 1645695000000,
    'value': 50.565773
  },
  {
    'timestmp': 1645696800000,
    'value': 48.7029495
  },
  {
    'timestmp': 1645698600000,
    'value': 53.7815475
  },
  {
    'timestmp': 1645700400000,
    'value': 48.2070236
  },
  {
    'timestmp': 1645702200000,
    'value': 51.9778252
  },
  {
    'timestmp': 1645704000000,
    'value': 50.9588737
  },
  {
    'timestmp': 1645705800000,
    'value': 49.4310341
  },
  {
    'timestmp': 1645707600000,
    'value': 52.0059052
  },
  {
    'timestmp': 1645709400000,
    'value': 48.3030815
  },
  {
    'timestmp': 1645711200000,
    'value': 50.1639862
  },
  {
    'timestmp': 1645713000000,
    'value': 50.9100494
  },
  {
    'timestmp': 1645714800000,
    'value': 48.6635818
  },
  {
    'timestmp': 1645716600000,
    'value': 53.3434525
  },
  {
    'timestmp': 1645718400000,
    'value': 51.4400101
  },
  {
    'timestmp': 1645720200000,
    'value': 50.3772774
  },
  {
    'timestmp': 1645722000000,
    'value': 53.0157394
  },
  {
    'timestmp': 1645723800000,
    'value': 48.575489
  },
  {
    'timestmp': 1645725600000,
    'value': 50.9716911
  },
  {
    'timestmp': 1645727400000,
    'value': 51.041893
  },
  {
    'timestmp': 1645729200000,
    'value': 50.2014465
  },
  {
    'timestmp': 1645731000000,
    'value': 51.8398705
  },
  {
    'timestmp': 1645732800000,
    'value': 50.1148033
  },
  {
    'timestmp': 1645734600000,
    'value': 49.1726875
  },
  {
    'timestmp': 1645736400000,
    'value': 49.8998184
  },
  {
    'timestmp': 1645738200000,
    'value': 47.0266991
  },
  {
    'timestmp': 1645740000000,
    'value': 51.0160942
  },
  {
    'timestmp': 1645741800000,
    'value': 51.2925758
  },
  {
    'timestmp': 1645743600000,
    'value': 45.3985367
  },
  {
    'timestmp': 1645745400000,
    'value': 54.5472412
  },
  {
    'timestmp': 1645747200000,
    'value': 53.5879326
  },
  {
    'timestmp': 1645749000000,
    'value': 50.4831352
  },
  {
    'timestmp': 1645750800000,
    'value': 49.7594566
  },
  {
    'timestmp': 1645752600000,
    'value': 49.4067154
  },
  {
    'timestmp': 1645754400000,
    'value': 53.5835075
  },
  {
    'timestmp': 1645756200000,
    'value': 44.7278328
  },
  {
    'timestmp': 1645758000000,
    'value': 54.8701286
  },
  {
    'timestmp': 1645759800000,
    'value': 52.8954544
  },
  {
    'timestmp': 1645761600000,
    'value': 47.3508835
  },
  {
    'timestmp': 1645763400000,
    'value': 50.3395233
  },
  {
    'timestmp': 1645765200000,
    'value': 54.7109451
  },
  {
    'timestmp': 1645767000000,
    'value': 46.1835632
  },
  {
    'timestmp': 1645768800000,
    'value': 54.3547058
  },
  {
    'timestmp': 1645770600000,
    'value': 44.5034637
  },
  {
    'timestmp': 1645772400000,
    'value': 45.6780167
  },
  {
    'timestmp': 1645774200000,
    'value': 51.7169151
  },
  {
    'timestmp': 1645776000000,
    'value': 50.1562195
  },
  {
    'timestmp': 1645777800000,
    'value': 49.2977676
  },
  {
    'timestmp': 1645779600000,
    'value': 47.7331276
  },
  {
    'timestmp': 1645781400000,
    'value': 49.2630501
  },
  {
    'timestmp': 1645783200000,
    'value': 51.4490509
  },
  {
    'timestmp': 1645785000000,
    'value': 48.8069763
  },
  {
    'timestmp': 1645786800000,
    'value': 51.788662
  },
  {
    'timestmp': 1645788600000,
    'value': 50.8114243
  },
  {
    'timestmp': 1645790400000,
    'value': 48.7802238
  },
  {
    'timestmp': 1645792200000,
    'value': 52.4341049
  },
  {
    'timestmp': 1645794000000,
    'value': 42.9888535
  },
  {
    'timestmp': 1645795800000,
    'value': null
  }
];


const CANDLE_CHART = [{'timestmp': 1548968400000, 'open': 24.0, 'close': 84.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1548970200000,
  'open': 84.0,
  'close': 22.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1548972000000, 'open': 22.0, 'close': 55.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1548973800000,
  'open': 55.0,
  'close': 58.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1548975600000, 'open': 58.0, 'close': 25.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1548977400000,
  'open': 25.0,
  'close': 97.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1548979200000, 'open': 90.0, 'close': 16.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1548981000000,
  'open': 16.0,
  'close': 57.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1548982800000, 'open': 57.0, 'close': 60.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1548984600000,
  'open': 60.0,
  'close': 24.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1548986400000, 'open': 24.0, 'close': 85.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1548988200000,
  'open': 85.0,
  'close': 26.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1548990000000, 'open': 26.0, 'close': 59.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1548991800000,
  'open': 59.0,
  'close': 69.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1548993600000, 'open': 69.0, 'close': 18.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1548995400000,
  'open': 18.0,
  'close': 86.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1548997200000, 'open': 86.0, 'close': 35.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1548999000000,
  'open': 35.0,
  'close': 53.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549000800000, 'open': 53.0, 'close': 62.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549002600000,
  'open': 62.0,
  'close': 30.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549004400000, 'open': 30.0, 'close': 96.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549006200000,
  'open': 96.0,
  'close': 39.0,
  'low': 2.0,
  'high': 99.0
}, {'timestmp': 1549008000000, 'open': 39.0, 'close': 49.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549009800000,
  'open': 49.0,
  'close': 56.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549011600000, 'open': 56.0, 'close': 19.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549013400000,
  'open': 19.0,
  'close': 73.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549015200000, 'open': 73.0, 'close': 22.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1549017000000,
  'open': 22.0,
  'close': 43.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549018800000, 'open': 43.0, 'close': 74.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549020600000,
  'open': 74.0,
  'close': 24.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549022400000, 'open': 24.0, 'close': 78.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549024200000,
  'open': 78.0,
  'close': 43.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549026000000, 'open': 43.0, 'close': 47.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1549027800000,
  'open': 47.0,
  'close': 73.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549029600000, 'open': 73.0, 'close': 2.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1549031400000,
  'open': 2.0,
  'close': 76.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549033200000, 'open': 76.0, 'close': 33.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1549035000000,
  'open': 33.0,
  'close': 45.0,
  'low': 2.0,
  'high': 100.0
}];


const BIG_TEXT = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi convallis congue nisi vel congue. Nulla vel sem non diam condimentum consectetur. Vivamus venenatis vehicula arcu, nec porta nisl. Aliquam vitae euismod arcu. Aenean fringilla, ligula et convallis fermentum, felis ligula commodo ante, non bibendum arcu diam vel ligula. Nullam lobortis interdum lorem ut convallis. Suspendisse potenti. Sed malesuada suscipit odio. Morbi a magna quis arcu semper consequat.',
  '\n\nMauris posuere, nunc eget pulvinar feugiat, urna quam egestas enim, non interdum enim arcu eu diam. Curabitur suscipit aliquet luctus. Proin eleifend nisl vitae tellus pulvinar elementum. Praesent sollicitudin, dui eu ultrices maximus, orci tortor efficitur libero, eu eleifend leo orci ut quam. Donec dignissim vel nibh sit amet congue. Suspendisse congue lacinia suscipit. Donec nec massa facilisis, aliquet leo nec, accumsan mi. Nam fringilla massa vitae tortor mollis congue. Sed purus arcu, ornare non turpis eu, molestie laoreet leo. Nunc eu rhoncus orci. Pellentesque quis nisi tempus, sagittis erat eu, finibus tortor. Fusce nisi ex, facilisis vitae aliquet in, rutrum sed neque. Aliquam pellentesque tellus risus, sit amet hendrerit nulla condimentum at. Aliquam ultrices, nisi nec sagittis imperdiet, velit orci semper dui, vitae bibendum sem felis vel leo. Ut non leo auctor, dictum nunc sodales, dapibus dolor.',
  '\n\nInteger blandit maximus sem, vel accumsan augue ultrices in. Curabitur ut dignissim magna, ut semper sem. Suspendisse tellus tortor, semper nec metus eu, maximus sodales tellus. Morbi sed tortor vel est vehicula blandit. Etiam id est risus. Ut consequat quis massa et commodo. Pellentesque fringilla commodo quam ac vestibulum. Quisque euismod elit velit, nec ultricies ligula consequat vitae. Ut aliquet sed sapien et elementum. Praesent rhoncus convallis nulla, vitae tempus magna euismod sit amet. Sed risus nunc, fringilla vel orci a, cursus rhoncus quam. Mauris tincidunt dolor lacus, et condimentum nisl tempor sit amet. Sed eros tortor, auctor a vulputate et, vulputate id ante. Quisque ultrices mollis vulputate. Aenean ut augue sem.',
  '\n\nDonec luctus mauris nec nibh varius, in posuere felis scelerisque. Donec vitae dapibus felis. In interdum, libero vehicula pellentesque iaculis, orci felis tempus mauris, vel ullamcorper leo odio quis nibh. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Sed fringilla vestibulum urna, nec sollicitudin lacus porta eu. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Aenean posuere ultrices nunc sit amet pretium. Quisque eget tortor semper, convallis diam sit amet, gravida purus. Maecenas finibus gravida mi eu convallis. Vivamus quis volutpat dui, vel elementum mauris. Aenean pretium odio tortor, et placerat ligula congue sit amet. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Cras ut tristique nisi. Suspendisse pharetra elit a ligula convallis dictum. Nunc egestas non leo eu ultrices.',
  '\n\nPraesent pulvinar nunc nec quam consectetur fringilla. Pellentesque tristique ex id mollis fermentum. Praesent sit amet lacinia nibh. Nulla at ex consequat, hendrerit sapien in, tincidunt tortor. Etiam eget efficitur libero. Proin consequat tellus at placerat sagittis. Nam vitae euismod sapien, sit amet ullamcorper odio. Sed tincidunt ut sem eu pellentesque. Sed efficitur nulla urna, sed finibus enim imperdiet in. Nulla ac nulla finibus, eleifend urna quis, semper felis.'
];
