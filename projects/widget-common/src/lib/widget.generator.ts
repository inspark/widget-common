import {
  Border,
  ChartTypes,
  EventValues,
  GenerateConfigItem,
  ITEM_TYPE,
  ItemCustom,
  ItemInterval,
  ItemSeries,
  ItemSingle,
  ItemTable,
  LineType,
  PARAM_STATE_INT,
  PARAM_TYPE,
  ParamConfigCustom,
  ParamConfigEvents,
  ParamConfigInterval,
  ParamConfigSeries,
  ParamConfigSingle,
  ParamConfigurator,
  SeriesDuration,
  VALUE_TYPE,
  WidgetArrayParam,
  WidgetItem,
  WidgetParamChildren,
  WidgetParamsChildren
} from './widget.interface';
import {findParam} from './widget.utils';

export function generateValues(inputValues: WidgetParamsChildren | WidgetArrayParam[],
                               params: ParamConfigurator[],
                               itemType = ITEM_TYPE.single, paramType = PARAM_TYPE.value, path = []): WidgetItem[] {

  if (inputValues instanceof Array) {
    // Проходимся по массив

    const result: WidgetItem[] = [];
    const conf: any = inputValues[0];
    itemType = conf.item_type !== undefined ? conf.item_type : itemType;
    paramType = conf.param_type !== undefined ? conf.param_type : paramType;
    const param = findParam(params, path.join('.'));
    const max = Math.min(param.generateConfig.count || 3, conf.max || 10);
    for (let i = 0; i < max; i++) {
      result.push(generateValue(i, conf, paramType, itemType, param));
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
              viewConfig: {...(param.param ? (param.param as ParamConfigurator).viewConfig : {})},
              custom_data: inputValues[key].custom_data
            };
          } else {
            // Если элемент - объект
            result[key] = {
              ...generateValues(inputValues[key].items, params, itemType, paramType, itemPath),
              config: generateParamConfig(itemType, param),
              viewConfig: {...(param.param ? (param.param as ParamConfigurator).viewConfig : {})},
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


function generateParamConfig(itemType: ITEM_TYPE, param: ParamConfigurator, paramType: PARAM_TYPE = null)
  : ParamConfigSeries | ParamConfigInterval | ParamConfigSingle | ParamConfigEvents | ParamConfigCustom {
  switch (itemType) {
    case ITEM_TYPE.custom:
      return {
        type: paramType,
        value: 'text'
      };
    case ITEM_TYPE.interval:
      return {
        dailyRange: 'dailyRange',
        stateMap: false,
        valueType: VALUE_TYPE.absolute,
        duration: SeriesDuration.day,
        count: 1,
      };

    case ITEM_TYPE.single:
      return {
        valueType: VALUE_TYPE.absolute,
      };

    case ITEM_TYPE.series:
      const config = param.config as ParamConfigSeries;
      return {
        charttype: (config && config.charttype) ? config.charttype : ChartTypes.lineChart,
        duration: SeriesDuration.month,
        count: 0,
        generator: true
      };
    case ITEM_TYPE.events:
      return {
        lineType: LineType.eventlog,
        attrList: ['shortname', 'serialnumber', 'eventid', 'name', 'timestmp', 'msg'],
        titleList: ['Short name', 'Serial number', 'Event', 'Full name', 'Time', 'Message'],
        size: 10
      };

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
        measure: {unit: generateMeasureUnit(), title: 'Электричество', id: 1},
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
        timezone: 3,
        latitude: 0,
        longitude: 0
      },
      param: {
        id: null,
        name: 'deviceParam name',
        measure: {unit: generateMeasureUnit(), title: 'Электричество', id: 1},
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
    data: (param.config && (param.config as ParamConfigSeries).charttype === ChartTypes.candlestickBarChart) ? CANDLE_CHART : generateChartValues(),
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
        measure: {unit: generateMeasureUnit(), title: 'Электричество', id: 1},
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
  return {
    data: EVENTS_DATA,
    config: {attrList: ['shortname', 'serialnumber', 'msg'], titleList: ['Объект', 'Сер.номер', 'Сообщение']}
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
    let json_value: any = undefined;
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

    console.log('config', config);
    console.log('item', item);
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
    },
    custom: {},
    borders: [],
    isEditing: false,
  };
}

function generateMeasureUnit() {
  const units = ['град', '°C', 'лит', 'км', '%'];
  return units[getRandom(0, units.length)];
}

// Возвращает случайное число между min (включительно) и max (включительно)
export function getRandom(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}

function getConfig(param, index): GenerateConfigItem {
  if (param.generateConfig.items) {
    return param.generateConfig.items[index] || {};
  }
  return param.generateConfig;
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

const CHART_VALUES = [{
  'timestmp': 1549764000000,
  'value': 51.94086339444116
}, {
  'timestmp': 1549765800000,
  'value': 49.844086021505376
}, {
  'timestmp': 1549767600000,
  'value': 49.731137724550905
}, {
  'timestmp': 1549769400000,
  'value': 52.1124330755503
}, {
  'timestmp': 1549771200000,
  'value': 48.595424443106516
}, {
  'timestmp': 1549773000000,
  'value': 51.90424895272294
}, {
  'timestmp': 1549774800000,
  'value': 49.67343283582091
}, {
  'timestmp': 1549776600000,
  'value': 49.70178571428571
}, {
  'timestmp': 1549778400000,
  'value': 51.47355912061795
}, {
  'timestmp': 1549780200000,
  'value': 48.42941874258593
}, {
  'timestmp': 1549782000000,
  'value': 51.80154028436016
}, {
  'timestmp': 1549783800000,
  'value': 49.64797136038186
}, {
  'timestmp': 1549785600000,
  'value': 50.04694835680751
}, {
  'timestmp': 1549787400000,
  'value': 52.25490196078428
}, {
  'timestmp': 1549789200000,
  'value': 48.73456057007125
}, {
  'timestmp': 1549791000000,
  'value': 51.631641086186555
}, {
  'timestmp': 1549792800000,
  'value': 50.124399038461505
}, {
  'timestmp': 1549794600000,
  'value': 49.71624033313505
}, {
  'timestmp': 1549796400000,
  'value': 52.33175074183976
}, {
  'timestmp': 1549798200000,
  'value': 48.65370813397126
}, {
  'timestmp': 1549800000000,
  'value': 51.29705351773902
}, {
  'timestmp': 1549801800000,
  'value': 50.39952578541792
}, {
  'timestmp': 1549803600000,
  'value': 49.329612220916566
}, {
  'timestmp': 1549805400000,
  'value': 51.85349940688019
}, {
  'timestmp': 1549807200000,
  'value': 48.548867699642415
}, {
  'timestmp': 1549809000000,
  'value': 51.45228215767635
}, {
  'timestmp': 1549810800000,
  'value': 50.42737597130899
}, {
  'timestmp': 1549812600000,
  'value': 49.08033077377435
}, {
  'timestmp': 1549814400000,
  'value': 52.44582593250443
}, {
  'timestmp': 1549816200000,
  'value': 48.796040791841634
}, {
  'timestmp': 1549818000000,
  'value': 51.08077830188681
}, {
  'timestmp': 1549819800000,
  'value': 51.105757931844906
}, {
  'timestmp': 1549821600000,
  'value': 49.18450620934358
}, {
  'timestmp': 1549823400000,
  'value': 52.334128878281604
}, {
  'timestmp': 1549825200000,
  'value': 49.44609004739335
}, {
  'timestmp': 1549827000000,
  'value': 50.742788461538495
}, {
  'timestmp': 1549828800000,
  'value': 51.22985074626866
}, {
  'timestmp': 1549830600000,
  'value': 49.019713261648796
}, {
  'timestmp': 1549832400000,
  'value': 52.10301953818829
}, {
  'timestmp': 1549834200000,
  'value': 48.88146811070999
}, {
  'timestmp': 1549836000000,
  'value': 50.28111971411555
}, {
  'timestmp': 1549837800000,
  'value': 51.53491124260355
}, {
  'timestmp': 1549839600000,
  'value': 49.16835217132659
}, {
  'timestmp': 1549841400000,
  'value': 52.38717339667457
}, {
  'timestmp': 1549843200000,
  'value': 49.57193605683838
}, {
  'timestmp': 1549845000000,
  'value': 50.07550535077291
}, {
  'timestmp': 1549846800000,
  'value': 51.745813397129204
}, {
  'timestmp': 1549848600000,
  'value': 48.88675853804672
}, {
  'timestmp': 1549850400000,
  'value': 52.09586578789695
}, {
  'timestmp': 1549852200000,
  'value': 50.01660735468565
}, {
  'timestmp': 1549854000000,
  'value': 49.91957421643998
}, {
  'timestmp': 1549855800000,
  'value': 51.79808841099164
}, {
  'timestmp': 1549857600000,
  'value': 48.795209580838325
}, {
  'timestmp': 1549859400000,
  'value': 51.60914010823811
}, {
  'timestmp': 1549861200000,
  'value': 50.15486194477795
}, {
  'timestmp': 1549863000000,
  'value': 49.53297997644286
}, {
  'timestmp': 1549864800000,
  'value': 52.12552301255232
}, {
  'timestmp': 1549866600000,
  'value': 48.69434628975266
}, {
  'timestmp': 1549868400000,
  'value': 51.36520190023753
}, {
  'timestmp': 1549870200000,
  'value': 50.4305144884684
}, {
  'timestmp': 1549872000000,
  'value': 49.33806986382472
}, {
  'timestmp': 1549873800000,
  'value': 51.88563049853372
}, {
  'timestmp': 1549875600000,
  'value': 48.81883194278902
}, {
  'timestmp': 1549877400000,
  'value': 51.47027663331373
}, {
  'timestmp': 1549879200000,
  'value': 50.22569239835003
}, {'timestmp': 1549881000000, 'value': 78.00333704115684}];


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


const EVENTS_DATA = {
  rowList: [{
    'shortname': 'Test AlphaOpen',
    'serialnumber': 'ALPHA1',
    'eventid': 5105,
    'name': 'Выход из строя ИБП, СБГЭ',
    'timestmp': 1543484923979,
    'paramname': 'Пожар',
    'paramvalue': null,
    'senttime': null,
    'resulttime': null,
    'state': null,
    'commandcode': null,
    'msg': 'Объект Test AlphaOpen, зона МЦА. Выход из строя ИБП или СБГЭ. «Пожар». 75,000000 вкл/выкл ',
    'cdpid': 5690,
    'ccpid': null,
    'categoryid': 10
  }, {
    'shortname': 'Test AlphaOpen',
    'serialnumber': 'ALPHA1',
    'eventid': 5105,
    'name': 'Выход из строя ИБП, СБГЭ',
    'timestmp': 1543484608828,
    'paramname': 'Пожар',
    'paramvalue': null,
    'senttime': null,
    'resulttime': null,
    'state': null,
    'commandcode': null,
    'msg': 'Объект Test AlphaOpen, зона МЦА. Выход из строя ИБП или СБГЭ. «Пожар». 75,000000 вкл/выкл ',
    'cdpid': 5690,
    'ccpid': null,
    'categoryid': 10
  }, {
    'shortname': 'Test AlphaOpen',
    'serialnumber': 'ALPHA1',
    'eventid': 5105,
    'name': 'Выход из строя ИБП, СБГЭ',
    'timestmp': 1543484293819,
    'paramname': 'Пожар',
    'paramvalue': null,
    'senttime': null,
    'resulttime': null,
    'state': null,
    'commandcode': null,
    'msg': 'Объект Test AlphaOpen, зона МЦА. Выход из строя ИБП или СБГЭ. «Пожар». 75,000000 вкл/выкл ',
    'cdpid': 5690,
    'ccpid': null,
    'categoryid': 10
  }, {
    'shortname': 'Test AlphaOpen',
    'serialnumber': 'ALPHA1',
    'eventid': 5105,
    'name': 'Выход из строя ИБП, СБГЭ',
    'timestmp': 1543483978891,
    'paramname': 'Пожар',
    'paramvalue': null,
    'senttime': null,
    'resulttime': null,
    'state': null,
    'commandcode': null,
    'msg': 'Объект Test AlphaOpen, зона МЦА. Выход из строя ИБП или СБГЭ. «Пожар». 75,000000 вкл/выкл ',
    'cdpid': 5690,
    'ccpid': null,
    'categoryid': 10
  }, {
    'shortname': 'Test AlphaOpen',
    'serialnumber': 'ALPHA1',
    'eventid': 5105,
    'name': 'Выход из строя ИБП, СБГЭ',
    'timestmp': 1543483663713,
    'paramname': 'Пожар',
    'paramvalue': null,
    'senttime': null,
    'resulttime': null,
    'state': null,
    'commandcode': null,
    'msg': 'Объект Test AlphaOpen, зона МЦА. Выход из строя ИБП или СБГЭ. «Пожар». 75,000000 вкл/выкл ',
    'cdpid': 5690,
    'ccpid': null,
    'categoryid': 10
  }, {
    'shortname': 'Test AlphaOpen',
    'serialnumber': 'ALPHA1',
    'eventid': 5105,
    'name': 'Выход из строя ИБП, СБГЭ',
    'timestmp': 1543483348410,
    'paramname': 'Пожар',
    'paramvalue': null,
    'senttime': null,
    'resulttime': null,
    'state': null,
    'commandcode': null,
    'msg': 'Объект Test AlphaOpen, зона МЦА. Выход из строя ИБП или СБГЭ. «Пожар». 75,000000 вкл/выкл ',
    'cdpid': 5690,
    'ccpid': null,
    'categoryid': 10
  }, {
    'shortname': 'Test AlphaOpen',
    'serialnumber': 'ALPHA1',
    'eventid': 5105,
    'name': 'Выход из строя ИБП, СБГЭ',
    'timestmp': 1543483033263,
    'paramname': 'Пожар',
    'paramvalue': null,
    'senttime': null,
    'resulttime': null,
    'state': null,
    'commandcode': null,
    'msg': 'Объект Test AlphaOpen, зона МЦА. Выход из строя ИБП или СБГЭ. «Пожар». 75,000000 вкл/выкл ',
    'cdpid': 5690,
    'ccpid': null,
    'categoryid': 10
  }, {
    'shortname': 'Test AlphaOpen',
    'serialnumber': 'ALPHA1',
    'eventid': 5105,
    'name': 'Выход из строя ИБП, СБГЭ',
    'timestmp': 1543482718006,
    'paramname': 'Пожар',
    'paramvalue': null,
    'senttime': null,
    'resulttime': null,
    'state': null,
    'commandcode': null,
    'msg': 'Объект Test AlphaOpen, зона МЦА. Выход из строя ИБП или СБГЭ. «Пожар». 75,000000 вкл/выкл ',
    'cdpid': 5690,
    'ccpid': null,
    'categoryid': 10
  }, {
    'shortname': 'Test AlphaOpen',
    'serialnumber': 'ALPHA1',
    'eventid': 5105,
    'name': 'Выход из строя ИБП, СБГЭ',
    'timestmp': 1543482402900,
    'paramname': 'Пожар',
    'paramvalue': null,
    'senttime': null,
    'resulttime': null,
    'state': null,
    'commandcode': null,
    'msg': 'Объект Test AlphaOpen, зона МЦА. Выход из строя ИБП или СБГЭ. «Пожар». 75,000000 вкл/выкл ',
    'cdpid': 5690,
    'ccpid': null,
    'categoryid': 10
  }, {
    'shortname': 'Test AlphaOpen',
    'serialnumber': 'ALPHA1',
    'eventid': 5105,
    'name': 'Выход из строя ИБП, СБГЭ',
    'timestmp': 1543482087815,
    'paramname': 'Пожар',
    'paramvalue': null,
    'senttime': null,
    'resulttime': null,
    'state': null,
    'commandcode': null,
    'msg': 'Объект Test AlphaOpen, зона МЦА. Выход из строя ИБП или СБГЭ. «Пожар». 75,000000 вкл/выкл ',
    'cdpid': 5690,
    'ccpid': null,
    'categoryid': 10
  }]
};

const BIG_TEXT = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi convallis congue nisi vel congue. Nulla vel sem non diam condimentum consectetur. Vivamus venenatis vehicula arcu, nec porta nisl. Aliquam vitae euismod arcu. Aenean fringilla, ligula et convallis fermentum, felis ligula commodo ante, non bibendum arcu diam vel ligula. Nullam lobortis interdum lorem ut convallis. Suspendisse potenti. Sed malesuada suscipit odio. Morbi a magna quis arcu semper consequat.',
  '\n\nMauris posuere, nunc eget pulvinar feugiat, urna quam egestas enim, non interdum enim arcu eu diam. Curabitur suscipit aliquet luctus. Proin eleifend nisl vitae tellus pulvinar elementum. Praesent sollicitudin, dui eu ultrices maximus, orci tortor efficitur libero, eu eleifend leo orci ut quam. Donec dignissim vel nibh sit amet congue. Suspendisse congue lacinia suscipit. Donec nec massa facilisis, aliquet leo nec, accumsan mi. Nam fringilla massa vitae tortor mollis congue. Sed purus arcu, ornare non turpis eu, molestie laoreet leo. Nunc eu rhoncus orci. Pellentesque quis nisi tempus, sagittis erat eu, finibus tortor. Fusce nisi ex, facilisis vitae aliquet in, rutrum sed neque. Aliquam pellentesque tellus risus, sit amet hendrerit nulla condimentum at. Aliquam ultrices, nisi nec sagittis imperdiet, velit orci semper dui, vitae bibendum sem felis vel leo. Ut non leo auctor, dictum nunc sodales, dapibus dolor.',
  '\n\nInteger blandit maximus sem, vel accumsan augue ultrices in. Curabitur ut dignissim magna, ut semper sem. Suspendisse tellus tortor, semper nec metus eu, maximus sodales tellus. Morbi sed tortor vel est vehicula blandit. Etiam id est risus. Ut consequat quis massa et commodo. Pellentesque fringilla commodo quam ac vestibulum. Quisque euismod elit velit, nec ultricies ligula consequat vitae. Ut aliquet sed sapien et elementum. Praesent rhoncus convallis nulla, vitae tempus magna euismod sit amet. Sed risus nunc, fringilla vel orci a, cursus rhoncus quam. Mauris tincidunt dolor lacus, et condimentum nisl tempor sit amet. Sed eros tortor, auctor a vulputate et, vulputate id ante. Quisque ultrices mollis vulputate. Aenean ut augue sem.',
  '\n\nDonec luctus mauris nec nibh varius, in posuere felis scelerisque. Donec vitae dapibus felis. In interdum, libero vehicula pellentesque iaculis, orci felis tempus mauris, vel ullamcorper leo odio quis nibh. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Sed fringilla vestibulum urna, nec sollicitudin lacus porta eu. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Aenean posuere ultrices nunc sit amet pretium. Quisque eget tortor semper, convallis diam sit amet, gravida purus. Maecenas finibus gravida mi eu convallis. Vivamus quis volutpat dui, vel elementum mauris. Aenean pretium odio tortor, et placerat ligula congue sit amet. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Cras ut tristique nisi. Suspendisse pharetra elit a ligula convallis dictum. Nunc egestas non leo eu ultrices.',
  '\n\nPraesent pulvinar nunc nec quam consectetur fringilla. Pellentesque tristique ex id mollis fermentum. Praesent sit amet lacinia nibh. Nulla at ex consequat, hendrerit sapien in, tincidunt tortor. Etiam eget efficitur libero. Proin consequat tellus at placerat sagittis. Nam vitae euismod sapien, sit amet ullamcorper odio. Sed tincidunt ut sem eu pellentesque. Sed efficitur nulla urna, sed finibus enim imperdiet in. Nulla ac nulla finibus, eleifend urna quis, semper felis.'
];
