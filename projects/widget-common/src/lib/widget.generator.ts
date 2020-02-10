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
  ParamConfigCustomType,
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
            };
          } else {
            // Если элемент - объект
            result[key] = {
              ...generateValues(inputValues[key].items, params, itemType, paramType, itemPath),
              config: generateParamConfig(itemType, param),
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
        type: paramType === PARAM_TYPE.custom_string ? ParamConfigCustomType.string : null,
        value: 'text'
      };
    case ITEM_TYPE.interval:
      return {
        dailyRange: 'dailyRange',
        stateMap: false,
        valueType: VALUE_TYPE.absolute,
        duration: 'day',
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

  switch (itemType) {
    case ITEM_TYPE.series:
      return generateSeriesParam(index, paramType, item, param);
    case ITEM_TYPE.single:
      return generateSingleParams(index, paramType, item, param);
    case ITEM_TYPE.table:
      return generateTableParams(index, paramType, item, param);
    case ITEM_TYPE.events:
      return generateEventsParams(index, paramType, item, param);
    case ITEM_TYPE.custom:
      return generateCustomParams(index, paramType, item, param);
    case ITEM_TYPE.interval:
      return generateIntervalParams(index, paramType, item, param);
  }
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
    error: require('../assets/error.svg'),
    falsevalue: require('../assets/falsevalue.svg'),
    none: require('../assets/none.svg'),
    success: require('../assets/success.svg'),
    warning: require('../assets/warning.svg'),
  };
}

function generateSingleParams(index: number, paramType: PARAM_TYPE, item: WidgetParamChildren, param: ParamConfigurator): ItemSingle {

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
    viewConfig: {view: config.view},
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
  const value = BIG_TEXT.slice(0, Math.min(config.paragraphCount || 2, 5)).join('\n');
  if (paramType === PARAM_TYPE.custom_string) {
    return {
      device: null,
      refName: '',
      itemType: ITEM_TYPE.custom,
      widgetId: null,
      title: config.title !== null ? config.title : 'Title param',
      config: generateParamConfig(ITEM_TYPE.custom, param, paramType),
      value: config.value ? config.value : value,
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
      value: (config.archer && config.archer.value )? config.archer.value : null,
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
}, {'timestmp': 1549765800000, 'value': 49.844086021505376}, {
  'timestmp': 1549765800000,
  'value': 49.844086021505376
}, {'timestmp': 1549767600000, 'value': 49.731137724550905}, {
  'timestmp': 1549767600000,
  'value': 49.731137724550905
}, {'timestmp': 1549769400000, 'value': 52.1124330755503}, {
  'timestmp': 1549769400000,
  'value': 52.1124330755503
}, {'timestmp': 1549771200000, 'value': 48.595424443106516}, {
  'timestmp': 1549771200000,
  'value': 48.595424443106516
}, {'timestmp': 1549773000000, 'value': 51.90424895272294}, {
  'timestmp': 1549773000000,
  'value': 51.90424895272294
}, {'timestmp': 1549774800000, 'value': 49.67343283582091}, {
  'timestmp': 1549774800000,
  'value': 49.67343283582091
}, {'timestmp': 1549776600000, 'value': 49.70178571428571}, {
  'timestmp': 1549776600000,
  'value': 49.70178571428571
}, {'timestmp': 1549778400000, 'value': 51.47355912061795}, {
  'timestmp': 1549778400000,
  'value': 51.47355912061795
}, {'timestmp': 1549780200000, 'value': 48.42941874258593}, {
  'timestmp': 1549780200000,
  'value': 48.42941874258593
}, {'timestmp': 1549782000000, 'value': 51.80154028436016}, {
  'timestmp': 1549782000000,
  'value': 51.80154028436016
}, {'timestmp': 1549783800000, 'value': 49.64797136038186}, {
  'timestmp': 1549783800000,
  'value': 49.64797136038186
}, {'timestmp': 1549785600000, 'value': 50.04694835680751}, {
  'timestmp': 1549785600000,
  'value': 50.04694835680751
}, {'timestmp': 1549787400000, 'value': 52.25490196078428}, {
  'timestmp': 1549787400000,
  'value': 52.25490196078428
}, {'timestmp': 1549789200000, 'value': 48.73456057007125}, {
  'timestmp': 1549789200000,
  'value': 48.73456057007125
}, {'timestmp': 1549791000000, 'value': 51.631641086186555}, {
  'timestmp': 1549791000000,
  'value': 51.631641086186555
}, {'timestmp': 1549792800000, 'value': 50.124399038461505}, {
  'timestmp': 1549792800000,
  'value': 50.124399038461505
}, {'timestmp': 1549794600000, 'value': 49.71624033313505}, {
  'timestmp': 1549794600000,
  'value': 49.71624033313505
}, {'timestmp': 1549796400000, 'value': 52.33175074183976}, {
  'timestmp': 1549796400000,
  'value': 52.33175074183976
}, {'timestmp': 1549798200000, 'value': 48.65370813397126}, {
  'timestmp': 1549798200000,
  'value': 48.65370813397126
}, {'timestmp': 1549800000000, 'value': 51.29705351773902}, {
  'timestmp': 1549800000000,
  'value': 51.29705351773902
}, {'timestmp': 1549801800000, 'value': 50.39952578541792}, {
  'timestmp': 1549801800000,
  'value': 50.39952578541792
}, {'timestmp': 1549803600000, 'value': 49.329612220916566}, {
  'timestmp': 1549803600000,
  'value': 49.329612220916566
}, {'timestmp': 1549805400000, 'value': 51.85349940688019}, {
  'timestmp': 1549805400000,
  'value': 51.85349940688019
}, {'timestmp': 1549807200000, 'value': 48.548867699642415}, {
  'timestmp': 1549807200000,
  'value': 48.548867699642415
}, {'timestmp': 1549809000000, 'value': 51.45228215767635}, {
  'timestmp': 1549809000000,
  'value': 51.45228215767635
}, {'timestmp': 1549810800000, 'value': 50.42737597130899}, {
  'timestmp': 1549810800000,
  'value': 50.42737597130899
}, {'timestmp': 1549812600000, 'value': 49.08033077377435}, {
  'timestmp': 1549812600000,
  'value': 49.08033077377435
}, {'timestmp': 1549814400000, 'value': 52.44582593250443}, {
  'timestmp': 1549814400000,
  'value': 52.44582593250443
}, {'timestmp': 1549816200000, 'value': 48.796040791841634}, {
  'timestmp': 1549816200000,
  'value': 48.796040791841634
}, {'timestmp': 1549818000000, 'value': 51.08077830188681}, {
  'timestmp': 1549818000000,
  'value': 51.08077830188681
}, {'timestmp': 1549819800000, 'value': 51.105757931844906}, {
  'timestmp': 1549819800000,
  'value': 51.105757931844906
}, {'timestmp': 1549821600000, 'value': 49.18450620934358}, {
  'timestmp': 1549821600000,
  'value': 49.18450620934358
}, {'timestmp': 1549823400000, 'value': 52.334128878281604}, {
  'timestmp': 1549823400000,
  'value': 52.334128878281604
}, {'timestmp': 1549825200000, 'value': 49.44609004739335}, {
  'timestmp': 1549825200000,
  'value': 49.44609004739335
}, {'timestmp': 1549827000000, 'value': 50.742788461538495}, {
  'timestmp': 1549827000000,
  'value': 50.742788461538495
}, {'timestmp': 1549828800000, 'value': 51.22985074626866}, {
  'timestmp': 1549828800000,
  'value': 51.22985074626866
}, {'timestmp': 1549830600000, 'value': 49.019713261648796}, {
  'timestmp': 1549830600000,
  'value': 49.019713261648796
}, {'timestmp': 1549832400000, 'value': 52.10301953818829}, {
  'timestmp': 1549832400000,
  'value': 52.10301953818829
}, {'timestmp': 1549834200000, 'value': 48.88146811070999}, {
  'timestmp': 1549834200000,
  'value': 48.88146811070999
}, {'timestmp': 1549836000000, 'value': 50.28111971411555}, {
  'timestmp': 1549836000000,
  'value': 50.28111971411555
}, {'timestmp': 1549837800000, 'value': 51.53491124260355}, {
  'timestmp': 1549837800000,
  'value': 51.53491124260355
}, {'timestmp': 1549839600000, 'value': 49.16835217132659}, {
  'timestmp': 1549839600000,
  'value': 49.16835217132659
}, {'timestmp': 1549841400000, 'value': 52.38717339667457}, {
  'timestmp': 1549841400000,
  'value': 52.38717339667457
}, {'timestmp': 1549843200000, 'value': 49.57193605683838}, {
  'timestmp': 1549843200000,
  'value': 49.57193605683838
}, {'timestmp': 1549845000000, 'value': 50.07550535077291}, {
  'timestmp': 1549845000000,
  'value': 50.07550535077291
}, {'timestmp': 1549846800000, 'value': 51.745813397129204}, {
  'timestmp': 1549846800000,
  'value': 51.745813397129204
}, {'timestmp': 1549848600000, 'value': 48.88675853804672}, {
  'timestmp': 1549848600000,
  'value': 48.88675853804672
}, {'timestmp': 1549850400000, 'value': 52.09586578789695}, {
  'timestmp': 1549850400000,
  'value': 52.09586578789695
}, {'timestmp': 1549852200000, 'value': 50.01660735468565}, {
  'timestmp': 1549852200000,
  'value': 50.01660735468565
}, {'timestmp': 1549854000000, 'value': 49.91957421643998}, {
  'timestmp': 1549854000000,
  'value': 49.91957421643998
}, {'timestmp': 1549855800000, 'value': 51.79808841099164}, {
  'timestmp': 1549855800000,
  'value': 51.79808841099164
}, {'timestmp': 1549857600000, 'value': 48.795209580838325}, {
  'timestmp': 1549857600000,
  'value': 48.795209580838325
}, {'timestmp': 1549859400000, 'value': 51.60914010823811}, {
  'timestmp': 1549859400000,
  'value': 51.60914010823811
}, {'timestmp': 1549861200000, 'value': 50.15486194477795}, {
  'timestmp': 1549861200000,
  'value': 50.15486194477795
}, {'timestmp': 1549863000000, 'value': 49.53297997644286}, {
  'timestmp': 1549863000000,
  'value': 49.53297997644286
}, {'timestmp': 1549864800000, 'value': 52.12552301255232}, {
  'timestmp': 1549864800000,
  'value': 52.12552301255232
}, {'timestmp': 1549866600000, 'value': 48.69434628975266}, {
  'timestmp': 1549866600000,
  'value': 48.69434628975266
}, {'timestmp': 1549868400000, 'value': 51.36520190023753}, {
  'timestmp': 1549868400000,
  'value': 51.36520190023753
}, {'timestmp': 1549870200000, 'value': 50.4305144884684}, {
  'timestmp': 1549870200000,
  'value': 50.4305144884684
}, {'timestmp': 1549872000000, 'value': 49.33806986382472}, {
  'timestmp': 1549872000000,
  'value': 49.33806986382472
}, {'timestmp': 1549873800000, 'value': 51.88563049853372}, {
  'timestmp': 1549873800000,
  'value': 51.88563049853372
}, {'timestmp': 1549875600000, 'value': 48.81883194278902}, {
  'timestmp': 1549875600000,
  'value': 48.81883194278902
}, {'timestmp': 1549877400000, 'value': 51.47027663331373}, {
  'timestmp': 1549877400000,
  'value': 51.47027663331373
}, {'timestmp': 1549879200000, 'value': 50.22569239835003}, {
  'timestmp': 1549879200000,
  'value': 50.22569239835003
}, {'timestmp': 1549881000000, 'value': 78.00333704115684}, {
  'timestmp': 1549881000000,
  'value': 78.00333704115684
}, {'timestmp': 1549882800000, 'value': 87.0}, {'timestmp': 1549882800000, 'value': 87.0}, {
  'timestmp': 1549884600000,
  'value': 87.0
}, {'timestmp': 1549884600000, 'value': 87.0}, {'timestmp': 1549886400000, 'value': 87.0}, {
  'timestmp': 1549886400000,
  'value': 87.0
}, {'timestmp': 1549888200000, 'value': 87.0}, {'timestmp': 1549888200000, 'value': 87.0}, {
  'timestmp': 1549890000000,
  'value': 87.0
}, {'timestmp': 1549890000000, 'value': 87.0}, {'timestmp': 1549891800000, 'value': 87.0}, {
  'timestmp': 1549891800000,
  'value': 87.0
}, {'timestmp': 1549893600000, 'value': 87.0}, {'timestmp': 1549893600000, 'value': 87.0}, {
  'timestmp': 1549895400000,
  'value': 87.0
}, {'timestmp': 1549895400000, 'value': 87.0}, {'timestmp': 1549897200000, 'value': 87.0}, {
  'timestmp': 1549897200000,
  'value': 87.0
}, {'timestmp': 1549899000000, 'value': 87.0}, {'timestmp': 1549899000000, 'value': 87.0}, {
  'timestmp': 1549900800000,
  'value': 87.0
}, {'timestmp': 1549900800000, 'value': 87.0}, {'timestmp': 1549902600000, 'value': 87.0}, {
  'timestmp': 1549902600000,
  'value': 87.0
}, {'timestmp': 1549904400000, 'value': 87.0}, {'timestmp': 1549904400000, 'value': 87.0}, {
  'timestmp': 1549906200000,
  'value': 87.0
}, {'timestmp': 1549906200000, 'value': 87.0}, {'timestmp': 1549908000000, 'value': 87.0}, {
  'timestmp': 1549908000000,
  'value': 87.0
}, {'timestmp': 1549909800000, 'value': 87.0}, {'timestmp': 1549909800000, 'value': 87.0}, {
  'timestmp': 1549911600000,
  'value': 87.0
}, {'timestmp': 1549911600000, 'value': 87.0}, {'timestmp': 1549913400000, 'value': 87.0}, {
  'timestmp': 1549913400000,
  'value': 87.0
}, {'timestmp': 1549915200000, 'value': 87.0}, {'timestmp': 1549915200000, 'value': 87.0}, {
  'timestmp': 1549917000000,
  'value': 87.0
}, {'timestmp': 1549917000000, 'value': 87.0}, {'timestmp': 1549918800000, 'value': 87.0}, {
  'timestmp': 1549918800000,
  'value': 87.0
}, {'timestmp': 1549920600000, 'value': 87.0}, {'timestmp': 1549920600000, 'value': 87.0}, {
  'timestmp': 1549922400000,
  'value': 87.0
}, {'timestmp': 1549922400000, 'value': 87.0}, {'timestmp': 1549924200000, 'value': 87.0}, {
  'timestmp': 1549924200000,
  'value': 87.0
}, {'timestmp': 1549926000000, 'value': 87.0}, {'timestmp': 1549926000000, 'value': 87.0}, {
  'timestmp': 1549927800000,
  'value': 87.0
}, {'timestmp': 1549927800000, 'value': 87.0}, {'timestmp': 1549929600000, 'value': 87.0}, {
  'timestmp': 1549929600000,
  'value': 87.0
}, {'timestmp': 1549931400000, 'value': 87.0}, {'timestmp': 1549931400000, 'value': 87.0}, {
  'timestmp': 1549933200000,
  'value': 87.0
}, {'timestmp': 1549933200000, 'value': 87.0}, {'timestmp': 1549935000000, 'value': 87.0}, {
  'timestmp': 1549935000000,
  'value': 87.0
}, {'timestmp': 1549936800000, 'value': 87.0}, {'timestmp': 1549936800000, 'value': 87.0}, {
  'timestmp': 1549938600000,
  'value': 87.0
}, {'timestmp': 1549938600000, 'value': 87.0}, {'timestmp': 1549940400000, 'value': 87.0}, {
  'timestmp': 1549940400000,
  'value': 87.0
}, {'timestmp': 1549942200000, 'value': 87.0}, {'timestmp': 1549942200000, 'value': 87.0}, {
  'timestmp': 1549944000000,
  'value': 87.0
}, {'timestmp': 1549944000000, 'value': 87.0}, {'timestmp': 1549945800000, 'value': 87.0}, {
  'timestmp': 1549945800000,
  'value': 87.0
}, {'timestmp': 1549947600000, 'value': 87.0}, {'timestmp': 1549947600000, 'value': 87.0}, {
  'timestmp': 1549949400000,
  'value': 87.0
}, {'timestmp': 1549949400000, 'value': 87.0}, {'timestmp': 1549951200000, 'value': 87.0}, {
  'timestmp': 1549951200000,
  'value': 87.0
}, {'timestmp': 1549953000000, 'value': 87.0}, {'timestmp': 1549953000000, 'value': 87.0}, {
  'timestmp': 1549954800000,
  'value': 87.0
}, {'timestmp': 1549954800000, 'value': 87.0}, {'timestmp': 1549956600000, 'value': 87.0}, {
  'timestmp': 1549956600000,
  'value': 87.0
}, {'timestmp': 1549958400000, 'value': 87.0}, {'timestmp': 1549958400000, 'value': 87.0}, {
  'timestmp': 1549960200000,
  'value': 87.0
}, {'timestmp': 1549960200000, 'value': 87.0}, {'timestmp': 1549962000000, 'value': 87.0}, {
  'timestmp': 1549962000000,
  'value': 87.0
}, {'timestmp': 1549963800000, 'value': 87.0}, {'timestmp': 1549963800000, 'value': 87.0}, {
  'timestmp': 1549965600000,
  'value': 87.0
}, {'timestmp': 1549965600000, 'value': 87.0}, {'timestmp': 1549967400000, 'value': 87.0}, {
  'timestmp': 1549967400000,
  'value': 87.0
}, {'timestmp': 1549969200000, 'value': 87.0}, {'timestmp': 1549969200000, 'value': 87.0}, {
  'timestmp': 1549971000000,
  'value': 87.0
}, {'timestmp': 1549971000000, 'value': 87.0}, {'timestmp': 1549972800000, 'value': 87.0}, {
  'timestmp': 1549972800000,
  'value': 87.0
}, {'timestmp': 1549974600000, 'value': 87.0}, {'timestmp': 1549974600000, 'value': 87.0}, {
  'timestmp': 1549976400000,
  'value': 87.0
}, {'timestmp': 1549976400000, 'value': 87.0}, {'timestmp': 1549978200000, 'value': 87.0}, {
  'timestmp': 1549978200000,
  'value': 87.0
}, {'timestmp': 1549980000000, 'value': 87.0}, {'timestmp': 1549980000000, 'value': 87.0}, {
  'timestmp': 1549981800000,
  'value': 87.0
}, {'timestmp': 1549981800000, 'value': 87.0}, {'timestmp': 1549983600000, 'value': 87.0}, {
  'timestmp': 1549983600000,
  'value': 87.0
}, {'timestmp': 1549985400000, 'value': 87.0}, {'timestmp': 1549985400000, 'value': 87.0}, {
  'timestmp': 1549987200000,
  'value': 87.0
}, {'timestmp': 1549987200000, 'value': 87.0}, {'timestmp': 1549989000000, 'value': 87.0}, {
  'timestmp': 1549989000000,
  'value': 87.0
}, {'timestmp': 1549990800000, 'value': 87.0}, {'timestmp': 1549990800000, 'value': 87.0}, {
  'timestmp': 1549992600000,
  'value': 87.0
}, {'timestmp': 1549992600000, 'value': 87.0}, {'timestmp': 1549994400000, 'value': 87.0}, {
  'timestmp': 1549994400000,
  'value': 87.0
}, {'timestmp': 1549996200000, 'value': 87.0}, {'timestmp': 1549996200000, 'value': 87.0}, {
  'timestmp': 1549998000000,
  'value': 87.0
}, {'timestmp': 1549998000000, 'value': 87.0}, {'timestmp': 1549999800000, 'value': 87.0}, {
  'timestmp': 1549999800000,
  'value': 87.0
}, {'timestmp': 1550001600000, 'value': 87.0}, {'timestmp': 1550001600000, 'value': 87.0}, {
  'timestmp': 1550003400000,
  'value': 87.0
}, {'timestmp': 1550003400000, 'value': 87.0}, {'timestmp': 1550005200000, 'value': 87.0}, {
  'timestmp': 1550005200000,
  'value': 87.0
}, {'timestmp': 1550007000000, 'value': 87.0}, {'timestmp': 1550007000000, 'value': 87.0}, {
  'timestmp': 1550008800000,
  'value': 87.0
}, {'timestmp': 1550008800000, 'value': 87.0}, {'timestmp': 1550010600000, 'value': 87.0}, {
  'timestmp': 1550010600000,
  'value': 87.0
}, {'timestmp': 1550012400000, 'value': 87.0}, {'timestmp': 1550012400000, 'value': 87.0}, {
  'timestmp': 1550014200000,
  'value': 87.0
}, {'timestmp': 1550014200000, 'value': 87.0}, {'timestmp': 1550016000000, 'value': 87.0}, {
  'timestmp': 1550016000000,
  'value': 87.0
}, {'timestmp': 1550017800000, 'value': 87.0}, {'timestmp': 1550017800000, 'value': 87.0}, {
  'timestmp': 1550019600000,
  'value': 87.0
}, {'timestmp': 1550019600000, 'value': 87.0}, {'timestmp': 1550021400000, 'value': 87.0}, {
  'timestmp': 1550021400000,
  'value': 87.0
}, {'timestmp': 1550023200000, 'value': 87.0}, {'timestmp': 1550023200000, 'value': 87.0}, {
  'timestmp': 1550025000000,
  'value': 87.0
}, {'timestmp': 1550025000000, 'value': 87.0}, {'timestmp': 1550026800000, 'value': 87.0}, {
  'timestmp': 1550026800000,
  'value': 87.0
}, {'timestmp': 1550028600000, 'value': 87.0}, {'timestmp': 1550028600000, 'value': 87.0}, {
  'timestmp': 1550030400000,
  'value': 87.0
}, {'timestmp': 1550030400000, 'value': 87.0}, {'timestmp': 1550032200000, 'value': 87.0}, {
  'timestmp': 1550032200000,
  'value': 87.0
}, {'timestmp': 1550034000000, 'value': 87.0}, {'timestmp': 1550034000000, 'value': 87.0}, {
  'timestmp': 1550035800000,
  'value': 87.0
}, {'timestmp': 1550035800000, 'value': 87.0}, {'timestmp': 1550037600000, 'value': 87.0}, {
  'timestmp': 1550037600000,
  'value': 87.0
}, {'timestmp': 1550039400000, 'value': 87.0}, {'timestmp': 1550039400000, 'value': 87.0}, {
  'timestmp': 1550041200000,
  'value': 87.0
}, {'timestmp': 1550041200000, 'value': 87.0}, {'timestmp': 1550043000000, 'value': 87.0}, {
  'timestmp': 1550043000000,
  'value': 87.0
}, {'timestmp': 1550044800000, 'value': 87.0}, {'timestmp': 1550044800000, 'value': 87.0}, {
  'timestmp': 1550046600000,
  'value': 87.0
}, {'timestmp': 1550046600000, 'value': 87.0}, {'timestmp': 1550048400000, 'value': 87.0}, {
  'timestmp': 1550048400000,
  'value': 87.0
}, {'timestmp': 1550050200000, 'value': 87.0}, {'timestmp': 1550050200000, 'value': 87.0}, {
  'timestmp': 1550052000000,
  'value': 87.0
}, {'timestmp': 1550052000000, 'value': 87.0}, {'timestmp': 1550053800000, 'value': 87.0}, {
  'timestmp': 1550053800000,
  'value': 87.0
}, {'timestmp': 1550055600000, 'value': 87.0}, {'timestmp': 1550055600000, 'value': 87.0}, {
  'timestmp': 1550057400000,
  'value': 87.0
}, {'timestmp': 1550057400000, 'value': 87.0}, {'timestmp': 1550059200000, 'value': 87.0}, {
  'timestmp': 1550059200000,
  'value': 87.0
}, {'timestmp': 1550061000000, 'value': 87.0}, {'timestmp': 1550061000000, 'value': 87.0}, {
  'timestmp': 1550062800000,
  'value': 87.0
}, {'timestmp': 1550062800000, 'value': 87.0}, {'timestmp': 1550064600000, 'value': 87.0}, {
  'timestmp': 1550064600000,
  'value': 87.0
}, {'timestmp': 1550066400000, 'value': 87.0}, {'timestmp': 1550066400000, 'value': 87.0}, {
  'timestmp': 1550068200000,
  'value': 87.0
}, {'timestmp': 1550068200000, 'value': 87.0}, {'timestmp': 1550070000000, 'value': 87.0}, {
  'timestmp': 1550070000000,
  'value': 87.0
}, {'timestmp': 1550071800000, 'value': 87.0}, {'timestmp': 1550071800000, 'value': 87.0}, {
  'timestmp': 1550073600000,
  'value': 87.0
}, {'timestmp': 1550073600000, 'value': 87.0}, {'timestmp': 1550075400000, 'value': 87.0}, {
  'timestmp': 1550075400000,
  'value': 87.0
}, {'timestmp': 1550077200000, 'value': 87.0}, {'timestmp': 1550077200000, 'value': 87.0}, {
  'timestmp': 1550079000000,
  'value': 87.0
}, {'timestmp': 1550079000000, 'value': 87.0}, {'timestmp': 1550080800000, 'value': 87.0}, {
  'timestmp': 1550080800000,
  'value': 87.0
}, {'timestmp': 1550082600000, 'value': 87.0}, {'timestmp': 1550082600000, 'value': 87.0}, {
  'timestmp': 1550084400000,
  'value': 87.0
}, {'timestmp': 1550084400000, 'value': 87.0}, {'timestmp': 1550086200000, 'value': 87.0}, {
  'timestmp': 1550086200000,
  'value': 87.0
}, {'timestmp': 1550088000000, 'value': 87.0}, {'timestmp': 1550088000000, 'value': 87.0}, {
  'timestmp': 1550089800000,
  'value': 87.0
}, {'timestmp': 1550089800000, 'value': 87.0}, {'timestmp': 1550091600000, 'value': 87.0}, {
  'timestmp': 1550091600000,
  'value': 87.0
}, {'timestmp': 1550093400000, 'value': 87.0}, {'timestmp': 1550093400000, 'value': 87.0}, {
  'timestmp': 1550095200000,
  'value': 87.0
}, {'timestmp': 1550095200000, 'value': 87.0}, {'timestmp': 1550097000000, 'value': 87.0}, {
  'timestmp': 1550097000000,
  'value': 87.0
}, {'timestmp': 1550098800000, 'value': 87.0}, {'timestmp': 1550098800000, 'value': 87.0}, {
  'timestmp': 1550100600000,
  'value': 87.0
}, {'timestmp': 1550100600000, 'value': 87.0}, {'timestmp': 1550102400000, 'value': 87.0}];


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
}, {'timestmp': 1549036800000, 'open': 45.0, 'close': 62.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549038600000,
  'open': 62.0,
  'close': 11.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549040400000, 'open': 11.0, 'close': 67.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549042200000,
  'open': 67.0,
  'close': 47.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1549044000000, 'open': 47.0, 'close': 49.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1549045800000,
  'open': 49.0,
  'close': 75.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549047600000, 'open': 75.0, 'close': 20.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549049400000,
  'open': 20.0,
  'close': 66.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549051200000, 'open': 72.0, 'close': 32.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1549053000000,
  'open': 32.0,
  'close': 42.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1549054800000, 'open': 42.0, 'close': 70.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549056600000,
  'open': 80.0,
  'close': 19.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549058400000, 'open': 10.0, 'close': 70.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1549060200000,
  'open': 70.0,
  'close': 54.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549062000000, 'open': 54.0, 'close': 35.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1549063800000,
  'open': 35.0,
  'close': 89.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549065600000, 'open': 89.0, 'close': 17.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1549067400000,
  'open': 17.0,
  'close': 65.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549069200000, 'open': 65.0, 'close': 45.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1549071000000,
  'open': 45.0,
  'close': 35.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1549072800000, 'open': 35.0, 'close': 89.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1549074600000,
  'open': 89.0,
  'close': 16.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549076400000, 'open': 21.0, 'close': 52.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1549078200000,
  'open': 52.0,
  'close': 44.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1549080000000, 'open': 44.0, 'close': 37.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549081800000,
  'open': 37.0,
  'close': 88.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1549083600000, 'open': 76.0, 'close': 28.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1549085400000,
  'open': 28.0,
  'close': 54.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549087200000, 'open': 54.0, 'close': 44.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549089000000,
  'open': 44.0,
  'close': 21.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549090800000, 'open': 21.0, 'close': 82.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549092600000,
  'open': 98.0,
  'close': 24.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549094400000, 'open': 24.0, 'close': 52.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549096200000,
  'open': 52.0,
  'close': 58.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1549098000000, 'open': 58.0, 'close': 28.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549099800000,
  'open': 28.0,
  'close': 96.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549101600000, 'open': 87.0, 'close': 34.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549103400000,
  'open': 34.0,
  'close': 70.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549105200000, 'open': 70.0, 'close': 52.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549107000000,
  'open': 52.0,
  'close': 20.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549108800000, 'open': 20.0, 'close': 86.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549110600000,
  'open': 92.0,
  'close': 26.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549112400000, 'open': 26.0, 'close': 44.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1549114200000,
  'open': 44.0,
  'close': 58.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1549116000000, 'open': 58.0, 'close': 19.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549117800000,
  'open': 19.0,
  'close': 91.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549119600000, 'open': 91.0, 'close': 40.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549121400000,
  'open': 40.0,
  'close': 57.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549123200000, 'open': 57.0, 'close': 62.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1549125000000,
  'open': 62.0,
  'close': 22.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1549126800000, 'open': 22.0, 'close': 87.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549128600000,
  'open': 87.0,
  'close': 24.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549130400000, 'open': 30.0, 'close': 48.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549132200000,
  'open': 48.0,
  'close': 72.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549134000000, 'open': 72.0, 'close': 20.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549135800000,
  'open': 20.0,
  'close': 76.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549137600000, 'open': 76.0, 'close': 49.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1549139400000,
  'open': 49.0,
  'close': 44.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549141200000, 'open': 44.0, 'close': 71.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549143000000,
  'open': 71.0,
  'close': 20.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1549144800000, 'open': 20.0, 'close': 75.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549146600000,
  'open': 81.0,
  'close': 37.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1549148400000, 'open': 37.0, 'close': 35.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549150200000,
  'open': 42.0,
  'close': 73.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549152000000, 'open': 73.0, 'close': 3.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549153800000,
  'open': 3.0,
  'close': 71.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549155600000, 'open': 71.0, 'close': 42.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549157400000,
  'open': 42.0,
  'close': 48.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1549159200000, 'open': 48.0, 'close': 72.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1549161000000,
  'open': 72.0,
  'close': 5.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549162800000, 'open': 5.0, 'close': 74.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549164600000,
  'open': 74.0,
  'close': 47.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549166400000, 'open': 47.0, 'close': 41.0, 'low': 2.0, 'high': 99.0}, {
  'timestmp': 1549168200000,
  'open': 41.0,
  'close': 84.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549170000000, 'open': 84.0, 'close': 19.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549171800000,
  'open': 19.0,
  'close': 75.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549173600000, 'open': 75.0, 'close': 46.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549175400000,
  'open': 46.0,
  'close': 46.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549177200000, 'open': 46.0, 'close': 87.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549179000000,
  'open': 87.0,
  'close': 23.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549180800000, 'open': 23.0, 'close': 61.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549182600000,
  'open': 61.0,
  'close': 53.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1549184400000, 'open': 53.0, 'close': 33.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549186200000,
  'open': 33.0,
  'close': 77.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1549188000000, 'open': 77.0, 'close': 21.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1549189800000,
  'open': 21.0,
  'close': 70.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549191600000, 'open': 70.0, 'close': 58.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549193400000,
  'open': 58.0,
  'close': 38.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549195200000, 'open': 24.0, 'close': 77.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549197000000,
  'open': 77.0,
  'close': 14.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549198800000, 'open': 14.0, 'close': 68.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1549200600000,
  'open': 68.0,
  'close': 53.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549202400000, 'open': 53.0, 'close': 31.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549204200000,
  'open': 31.0,
  'close': 76.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549206000000, 'open': 76.0, 'close': 28.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549207800000,
  'open': 28.0,
  'close': 52.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549209600000, 'open': 52.0, 'close': 55.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549211400000,
  'open': 55.0,
  'close': 31.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549213200000, 'open': 31.0, 'close': 89.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1549215000000,
  'open': 89.0,
  'close': 11.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549216800000, 'open': 11.0, 'close': 60.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549218600000,
  'open': 60.0,
  'close': 69.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1549220400000, 'open': 69.0, 'close': 39.0, 'low': 2.0, 'high': 99.0}, {
  'timestmp': 1549222200000,
  'open': 28.0,
  'close': 90.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549224000000, 'open': 90.0, 'close': 24.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549225800000,
  'open': 24.0,
  'close': 55.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549227600000, 'open': 55.0, 'close': 60.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549229400000,
  'open': 60.0,
  'close': 23.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549231200000, 'open': 23.0, 'close': 98.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549233000000,
  'open': 86.0,
  'close': 33.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549234800000, 'open': 33.0, 'close': 55.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549236600000,
  'open': 43.0,
  'close': 68.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549238400000, 'open': 68.0, 'close': 29.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549240200000,
  'open': 22.0,
  'close': 88.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549242000000, 'open': 88.0, 'close': 24.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549243800000,
  'open': 24.0,
  'close': 50.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549245600000, 'open': 43.0, 'close': 64.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549247400000,
  'open': 64.0,
  'close': 14.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1549249200000, 'open': 14.0, 'close': 85.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549251000000,
  'open': 85.0,
  'close': 27.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549252800000, 'open': 27.0, 'close': 45.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549254600000,
  'open': 45.0,
  'close': 72.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549256400000, 'open': 72.0, 'close': 20.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1549258200000,
  'open': 20.0,
  'close': 87.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549260000000, 'open': 87.0, 'close': 34.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549261800000,
  'open': 34.0,
  'close': 48.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549263600000, 'open': 48.0, 'close': 68.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549265400000,
  'open': 68.0,
  'close': 21.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1549267200000, 'open': 21.0, 'close': 84.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549269000000,
  'open': 84.0,
  'close': 32.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549270800000, 'open': 43.0, 'close': 44.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549272600000,
  'open': 44.0,
  'close': 64.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1549274400000, 'open': 64.0, 'close': 29.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549276200000,
  'open': 29.0,
  'close': 76.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549278000000, 'open': 76.0, 'close': 38.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549279800000,
  'open': 38.0,
  'close': 53.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549281600000, 'open': 53.0, 'close': 74.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549283400000,
  'open': 74.0,
  'close': 3.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549285200000, 'open': 3.0, 'close': 82.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1549287000000,
  'open': 82.0,
  'close': 45.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549288800000, 'open': 45.0, 'close': 47.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549290600000,
  'open': 47.0,
  'close': 63.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549292400000, 'open': 63.0, 'close': 15.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549294200000,
  'open': 15.0,
  'close': 72.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1549296000000, 'open': 72.0, 'close': 45.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549297800000,
  'open': 45.0,
  'close': 38.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549299600000, 'open': 38.0, 'close': 64.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549301400000,
  'open': 64.0,
  'close': 9.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549303200000, 'open': 9.0, 'close': 71.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549305000000,
  'open': 71.0,
  'close': 34.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549306800000, 'open': 34.0, 'close': 48.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549308600000,
  'open': 48.0,
  'close': 84.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549310400000, 'open': 84.0, 'close': 15.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549312200000,
  'open': 14.0,
  'close': 75.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549314000000, 'open': 64.0, 'close': 36.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549315800000,
  'open': 51.0,
  'close': 50.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549317600000, 'open': 50.0, 'close': 79.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549319400000,
  'open': 79.0,
  'close': 16.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549321200000, 'open': 16.0, 'close': 80.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1549323000000,
  'open': 80.0,
  'close': 50.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1549324800000, 'open': 50.0, 'close': 32.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1549326600000,
  'open': 32.0,
  'close': 83.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549328400000, 'open': 83.0, 'close': 14.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549330200000,
  'open': 14.0,
  'close': 65.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549332000000, 'open': 65.0, 'close': 44.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1549333800000,
  'open': 44.0,
  'close': 31.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1549335600000, 'open': 31.0, 'close': 85.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549337400000,
  'open': 85.0,
  'close': 28.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549339200000, 'open': 16.0, 'close': 56.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549341000000,
  'open': 69.0,
  'close': 51.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549342800000, 'open': 51.0, 'close': 22.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549344600000,
  'open': 22.0,
  'close': 90.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549346400000, 'open': 90.0, 'close': 27.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1549348200000,
  'open': 27.0,
  'close': 60.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549350000000, 'open': 60.0, 'close': 55.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549351800000,
  'open': 55.0,
  'close': 35.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1549353600000, 'open': 35.0, 'close': 86.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549355400000,
  'open': 86.0,
  'close': 17.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549357200000, 'open': 17.0, 'close': 61.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549359000000,
  'open': 61.0,
  'close': 56.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549360800000, 'open': 46.0, 'close': 23.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549362600000,
  'open': 23.0,
  'close': 96.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1549364400000, 'open': 96.0, 'close': 16.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549366200000,
  'open': 16.0,
  'close': 65.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549368000000, 'open': 65.0, 'close': 60.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549369800000,
  'open': 60.0,
  'close': 23.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549371600000, 'open': 29.0, 'close': 94.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1549373400000,
  'open': 94.0,
  'close': 23.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549375200000, 'open': 23.0, 'close': 52.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549377000000,
  'open': 52.0,
  'close': 69.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1549378800000, 'open': 69.0, 'close': 22.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549380600000,
  'open': 22.0,
  'close': 96.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549382400000, 'open': 96.0, 'close': 37.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1549384200000,
  'open': 37.0,
  'close': 42.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549386000000, 'open': 42.0, 'close': 55.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549387800000,
  'open': 55.0,
  'close': 13.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549389600000, 'open': 20.0, 'close': 71.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549391400000,
  'open': 71.0,
  'close': 33.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1549393200000, 'open': 33.0, 'close': 53.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549395000000,
  'open': 53.0,
  'close': 76.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549396800000, 'open': 76.0, 'close': 29.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549398600000,
  'open': 29.0,
  'close': 86.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1549400400000, 'open': 86.0, 'close': 38.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549402200000,
  'open': 38.0,
  'close': 47.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549404000000, 'open': 47.0, 'close': 63.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1549405800000,
  'open': 63.0,
  'close': 17.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549407600000, 'open': 17.0, 'close': 74.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549409400000,
  'open': 74.0,
  'close': 37.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549411200000, 'open': 37.0, 'close': 59.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549413000000,
  'open': 59.0,
  'close': 66.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1549414800000, 'open': 66.0, 'close': 30.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549416600000,
  'open': 30.0,
  'close': 73.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549418400000, 'open': 73.0, 'close': 25.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1549420200000,
  'open': 25.0,
  'close': 44.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1549422000000, 'open': 44.0, 'close': 65.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549423800000,
  'open': 65.0,
  'close': 11.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549425600000, 'open': 11.0, 'close': 85.0, 'low': 1.0, 'high': 98.0}, {
  'timestmp': 1549427400000,
  'open': 85.0,
  'close': 40.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549429200000, 'open': 40.0, 'close': 44.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549431000000,
  'open': 44.0,
  'close': 73.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549432800000, 'open': 73.0, 'close': 7.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549434600000,
  'open': 7.0,
  'close': 77.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549436400000, 'open': 77.0, 'close': 48.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549438200000,
  'open': 48.0,
  'close': 49.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549440000000, 'open': 49.0, 'close': 71.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549441800000,
  'open': 71.0,
  'close': 6.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1549443600000, 'open': 6.0, 'close': 77.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549445400000,
  'open': 77.0,
  'close': 34.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1549447200000, 'open': 34.0, 'close': 34.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549449000000,
  'open': 34.0,
  'close': 64.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549450800000, 'open': 80.0, 'close': 12.0, 'low': 2.0, 'high': 99.0}, {
  'timestmp': 1549452600000,
  'open': 12.0,
  'close': 73.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549454400000, 'open': 73.0, 'close': 35.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1549456200000,
  'open': 35.0,
  'close': 38.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549458000000, 'open': 38.0, 'close': 84.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549459800000,
  'open': 84.0,
  'close': 8.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549461600000, 'open': 8.0, 'close': 63.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1549463400000,
  'open': 63.0,
  'close': 35.0,
  'low': 2.0,
  'high': 99.0
}, {'timestmp': 1549465200000, 'open': 35.0, 'close': 35.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549467000000,
  'open': 35.0,
  'close': 75.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1549468800000, 'open': 67.0, 'close': 9.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549470600000,
  'open': 9.0,
  'close': 64.0,
  'low': 2.0,
  'high': 99.0
}, {'timestmp': 1549472400000, 'open': 64.0, 'close': 47.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1549474200000,
  'open': 59.0,
  'close': 36.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549476000000, 'open': 48.0, 'close': 74.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1549477800000,
  'open': 74.0,
  'close': 5.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549479600000, 'open': 5.0, 'close': 72.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549481400000,
  'open': 72.0,
  'close': 35.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549483200000, 'open': 35.0, 'close': 48.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549485000000,
  'open': 48.0,
  'close': 63.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549486800000, 'open': 78.0, 'close': 16.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549488600000,
  'open': 16.0,
  'close': 76.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549490400000, 'open': 76.0, 'close': 36.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549492200000,
  'open': 36.0,
  'close': 40.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549494000000, 'open': 40.0, 'close': 72.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1549495800000,
  'open': 72.0,
  'close': 19.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1549497600000, 'open': 19.0, 'close': 67.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549499400000,
  'open': 67.0,
  'close': 57.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549501200000, 'open': 57.0, 'close': 32.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549503000000,
  'open': 32.0,
  'close': 83.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549504800000, 'open': 83.0, 'close': 20.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549506600000,
  'open': 20.0,
  'close': 70.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549508400000, 'open': 70.0, 'close': 50.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549510200000,
  'open': 50.0,
  'close': 25.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1549512000000, 'open': 25.0, 'close': 72.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549513800000,
  'open': 72.0,
  'close': 22.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549515600000, 'open': 22.0, 'close': 66.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549517400000,
  'open': 66.0,
  'close': 48.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549519200000, 'open': 48.0, 'close': 40.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549521000000,
  'open': 40.0,
  'close': 88.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1549522800000, 'open': 88.0, 'close': 29.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549524600000,
  'open': 29.0,
  'close': 62.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1549526400000, 'open': 62.0, 'close': 54.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549528200000,
  'open': 54.0,
  'close': 39.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549530000000, 'open': 39.0, 'close': 92.0, 'low': 1.0, 'high': 98.0}, {
  'timestmp': 1549531800000,
  'open': 92.0,
  'close': 28.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549533600000, 'open': 28.0, 'close': 60.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549535400000,
  'open': 60.0,
  'close': 51.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549537200000, 'open': 51.0, 'close': 33.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549539000000,
  'open': 33.0,
  'close': 92.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549540800000, 'open': 92.0, 'close': 36.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1549542600000,
  'open': 36.0,
  'close': 64.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549544400000, 'open': 64.0, 'close': 68.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549546200000,
  'open': 68.0,
  'close': 25.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549548000000, 'open': 25.0, 'close': 83.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549549800000,
  'open': 83.0,
  'close': 26.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549551600000, 'open': 26.0, 'close': 67.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1549553400000,
  'open': 67.0,
  'close': 61.0,
  'low': 1.0,
  'high': 98.0
}, {'timestmp': 1549555200000, 'open': 61.0, 'close': 22.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549557000000,
  'open': 22.0,
  'close': 95.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549558800000, 'open': 95.0, 'close': 33.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549560600000,
  'open': 33.0,
  'close': 48.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549562400000, 'open': 48.0, 'close': 52.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549564200000,
  'open': 52.0,
  'close': 28.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549566000000, 'open': 28.0, 'close': 77.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549567800000,
  'open': 77.0,
  'close': 23.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549569600000, 'open': 23.0, 'close': 50.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549571400000,
  'open': 50.0,
  'close': 72.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549573200000, 'open': 66.0, 'close': 23.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549575000000,
  'open': 23.0,
  'close': 78.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549576800000, 'open': 78.0, 'close': 35.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549578600000,
  'open': 44.0,
  'close': 48.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549580400000, 'open': 48.0, 'close': 61.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1549582200000,
  'open': 61.0,
  'close': 15.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549584000000, 'open': 15.0, 'close': 88.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1549585800000,
  'open': 88.0,
  'close': 40.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549587600000, 'open': 40.0, 'close': 44.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1549589400000,
  'open': 38.0,
  'close': 70.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549591200000, 'open': 70.0, 'close': 17.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1549593000000,
  'open': 17.0,
  'close': 64.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549594800000, 'open': 64.0, 'close': 33.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549596600000,
  'open': 33.0,
  'close': 46.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549598400000, 'open': 46.0, 'close': 71.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1549600200000,
  'open': 71.0,
  'close': 11.0,
  'low': 2.0,
  'high': 99.0
}, {'timestmp': 1549602000000, 'open': 11.0, 'close': 77.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1549603800000,
  'open': 77.0,
  'close': 54.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549605600000, 'open': 54.0, 'close': 34.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549607400000,
  'open': 34.0,
  'close': 88.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549609200000, 'open': 88.0, 'close': 14.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549611000000,
  'open': 14.0,
  'close': 63.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549612800000, 'open': 79.0, 'close': 50.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549614600000,
  'open': 50.0,
  'close': 33.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549616400000, 'open': 33.0, 'close': 87.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549618200000,
  'open': 78.0,
  'close': 17.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549620000000, 'open': 17.0, 'close': 78.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549621800000,
  'open': 78.0,
  'close': 56.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549623600000, 'open': 56.0, 'close': 26.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549625400000,
  'open': 26.0,
  'close': 87.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1549627200000, 'open': 87.0, 'close': 24.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1549629000000,
  'open': 24.0,
  'close': 52.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549630800000, 'open': 70.0, 'close': 41.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549632600000,
  'open': 41.0,
  'close': 37.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549634400000, 'open': 37.0, 'close': 87.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549636200000,
  'open': 87.0,
  'close': 12.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549638000000, 'open': 12.0, 'close': 70.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549639800000,
  'open': 70.0,
  'close': 60.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549641600000, 'open': 60.0, 'close': 27.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549643400000,
  'open': 27.0,
  'close': 99.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549645200000, 'open': 87.0, 'close': 21.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549647000000,
  'open': 21.0,
  'close': 52.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549648800000, 'open': 65.0, 'close': 61.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549650600000,
  'open': 61.0,
  'close': 29.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549652400000, 'open': 29.0, 'close': 99.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549654200000,
  'open': 99.0,
  'close': 37.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1549656000000, 'open': 37.0, 'close': 69.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549657800000,
  'open': 69.0,
  'close': 54.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1549659600000, 'open': 54.0, 'close': 14.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549661400000,
  'open': 14.0,
  'close': 88.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1549663200000, 'open': 88.0, 'close': 32.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549665000000,
  'open': 32.0,
  'close': 55.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549666800000, 'open': 55.0, 'close': 66.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1549668600000,
  'open': 66.0,
  'close': 27.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1549670400000, 'open': 27.0, 'close': 81.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549672200000,
  'open': 81.0,
  'close': 38.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549674000000, 'open': 23.0, 'close': 44.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549675800000,
  'open': 44.0,
  'close': 69.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1549677600000, 'open': 69.0, 'close': 16.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549679400000,
  'open': 24.0,
  'close': 84.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549681200000, 'open': 84.0, 'close': 32.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549683000000,
  'open': 32.0,
  'close': 58.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1549684800000, 'open': 58.0, 'close': 74.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549686600000,
  'open': 74.0,
  'close': 6.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1549688400000, 'open': 6.0, 'close': 88.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549690200000,
  'open': 88.0,
  'close': 36.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549692000000, 'open': 36.0, 'close': 49.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549693800000,
  'open': 49.0,
  'close': 66.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1549695600000, 'open': 72.0, 'close': 19.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549697400000,
  'open': 19.0,
  'close': 76.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549699200000, 'open': 76.0, 'close': 42.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549701000000,
  'open': 42.0,
  'close': 41.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549702800000, 'open': 41.0, 'close': 63.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549704600000,
  'open': 63.0,
  'close': 16.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549706400000, 'open': 16.0, 'close': 71.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549708200000,
  'open': 71.0,
  'close': 42.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549710000000, 'open': 42.0, 'close': 37.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1549711800000,
  'open': 37.0,
  'close': 77.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1549713600000, 'open': 77.0, 'close': 7.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549715400000,
  'open': 7.0,
  'close': 70.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1549717200000, 'open': 70.0, 'close': 49.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1549719000000,
  'open': 49.0,
  'close': 46.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549720800000, 'open': 46.0, 'close': 81.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549722600000,
  'open': 81.0,
  'close': 26.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549724400000, 'open': 26.0, 'close': 80.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549726200000,
  'open': 80.0,
  'close': 59.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549728000000, 'open': 59.0, 'close': 48.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1549729800000,
  'open': 48.0,
  'close': 83.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1549731600000, 'open': 83.0, 'close': 28.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549733400000,
  'open': 19.0,
  'close': 66.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549735200000, 'open': 66.0, 'close': 53.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549737000000,
  'open': 53.0,
  'close': 31.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549738800000, 'open': 31.0, 'close': 78.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549740600000,
  'open': 78.0,
  'close': 23.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549742400000, 'open': 23.0, 'close': 74.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549744200000,
  'open': 65.0,
  'close': 48.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549746000000, 'open': 48.0, 'close': 24.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1549747800000,
  'open': 24.0,
  'close': 72.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549749600000, 'open': 72.0, 'close': 12.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549751400000,
  'open': 12.0,
  'close': 68.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549753200000, 'open': 68.0, 'close': 51.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1549755000000,
  'open': 51.0,
  'close': 34.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549756800000, 'open': 34.0, 'close': 92.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1549758600000,
  'open': 92.0,
  'close': 20.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549760400000, 'open': 20.0, 'close': 65.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1549762200000,
  'open': 55.0,
  'close': 62.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549764000000, 'open': 62.0, 'close': 22.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1549765800000,
  'open': 28.0,
  'close': 82.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549767600000, 'open': 82.0, 'close': 35.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549769400000,
  'open': 35.0,
  'close': 54.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549771200000, 'open': 54.0, 'close': 54.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549773000000,
  'open': 66.0,
  'close': 24.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549774800000, 'open': 24.0, 'close': 95.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1549776600000,
  'open': 95.0,
  'close': 37.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549778400000, 'open': 37.0, 'close': 60.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549780200000,
  'open': 60.0,
  'close': 63.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549782000000, 'open': 63.0, 'close': 24.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1549783800000,
  'open': 24.0,
  'close': 100.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549785600000, 'open': 100.0, 'close': 31.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549787400000,
  'open': 31.0,
  'close': 59.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549789200000, 'open': 59.0, 'close': 52.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1549791000000,
  'open': 52.0,
  'close': 13.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549792800000, 'open': 18.0, 'close': 99.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549794600000,
  'open': 99.0,
  'close': 37.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549796400000, 'open': 37.0, 'close': 48.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549798200000,
  'open': 48.0,
  'close': 51.0,
  'low': 2.0,
  'high': 99.0
}, {'timestmp': 1549800000000, 'open': 51.0, 'close': 19.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1549801800000,
  'open': 19.0,
  'close': 78.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1549803600000, 'open': 78.0, 'close': 21.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549805400000,
  'open': 21.0,
  'close': 52.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549807200000, 'open': 52.0, 'close': 63.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549809000000,
  'open': 70.0,
  'close': 17.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549810800000, 'open': 17.0, 'close': 79.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549812600000,
  'open': 79.0,
  'close': 48.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549814400000, 'open': 48.0, 'close': 32.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549816200000,
  'open': 32.0,
  'close': 73.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549818000000, 'open': 73.0, 'close': 17.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549819800000,
  'open': 17.0,
  'close': 76.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1549821600000, 'open': 76.0, 'close': 33.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549823400000,
  'open': 33.0,
  'close': 48.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549825200000, 'open': 40.0, 'close': 74.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1549827000000,
  'open': 74.0,
  'close': 18.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549828800000, 'open': 18.0, 'close': 75.0, 'low': 2.0, 'high': 99.0}, {
  'timestmp': 1549830600000,
  'open': 75.0,
  'close': 44.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549832400000, 'open': 44.0, 'close': 40.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549834200000,
  'open': 40.0,
  'close': 71.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549836000000, 'open': 71.0, 'close': 19.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1549837800000,
  'open': 19.0,
  'close': 78.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549839600000, 'open': 78.0, 'close': 46.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1549841400000,
  'open': 46.0,
  'close': 35.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549843200000, 'open': 35.0, 'close': 91.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549845000000,
  'open': 91.0,
  'close': 27.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549846800000, 'open': 27.0, 'close': 58.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549848600000,
  'open': 58.0,
  'close': 68.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1549850400000, 'open': 68.0, 'close': 21.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1549852200000,
  'open': 21.0,
  'close': 100.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1549854000000, 'open': 100.0, 'close': 33.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1549855800000,
  'open': 33.0,
  'close': 63.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549857600000, 'open': 63.0, 'close': 53.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549859400000,
  'open': 53.0,
  'close': 15.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1549861200000, 'open': 15.0, 'close': 94.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1549863000000,
  'open': 94.0,
  'close': 24.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549864800000, 'open': 24.0, 'close': 46.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1549866600000,
  'open': 46.0,
  'close': 52.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549868400000, 'open': 52.0, 'close': 29.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549870200000,
  'open': 29.0,
  'close': 73.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549872000000, 'open': 83.0, 'close': 26.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549873800000,
  'open': 26.0,
  'close': 42.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1549875600000, 'open': 42.0, 'close': 67.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1549877400000,
  'open': 67.0,
  'close': 12.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1549879200000, 'open': 12.0, 'close': 72.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1549881000000,
  'open': 81.0,
  'close': 87.0,
  'low': 81.0,
  'high': 87.0
}, {'timestmp': 1549882800000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1549884600000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1549886400000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1549888200000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1549890000000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1549891800000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1549893600000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1549895400000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1549897200000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1549899000000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1549900800000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1549902600000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1549904400000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1549906200000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1549908000000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1549909800000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1549911600000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1549913400000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1549915200000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1549917000000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1549918800000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1549920600000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1549922400000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1549924200000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1549926000000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1549927800000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1549929600000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1549931400000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1549933200000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1549935000000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1549936800000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1549938600000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1549940400000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1549942200000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1549944000000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1549945800000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1549947600000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1549949400000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1549951200000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1549953000000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1549954800000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1549956600000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1549958400000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1549960200000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1549962000000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1549963800000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1549965600000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1549967400000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1549969200000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1549971000000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1549972800000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1549974600000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1549976400000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1549978200000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1549980000000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1549981800000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1549983600000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1549985400000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1549987200000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1549989000000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1549990800000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1549992600000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1549994400000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1549996200000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1549998000000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1549999800000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550001600000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550003400000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550005200000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550007000000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550008800000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550010600000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550012400000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550014200000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550016000000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550017800000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550019600000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550021400000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550023200000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550025000000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550026800000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550028600000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550030400000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550032200000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550034000000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550035800000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550037600000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550039400000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550041200000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550043000000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550044800000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550046600000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550048400000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550050200000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550052000000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550053800000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550055600000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550057400000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550059200000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550061000000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550062800000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550064600000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550066400000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550068200000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550070000000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550071800000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550073600000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550075400000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550077200000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550079000000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550080800000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550082600000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550084400000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550086200000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550088000000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550089800000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550091600000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550093400000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550095200000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550097000000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550098800000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550100600000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550102400000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550104200000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550106000000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550107800000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550109600000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550111400000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550113200000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550115000000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550116800000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550118600000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550120400000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550122200000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550124000000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550125800000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550127600000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550129400000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550131200000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550133000000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550134800000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550136600000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550138400000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550140200000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550142000000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550143800000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550145600000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550147400000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550149200000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550151000000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550152800000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550154600000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550156400000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550158200000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550160000000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550161800000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550163600000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550165400000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550167200000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550169000000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550170800000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550172600000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550174400000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550176200000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550178000000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550179800000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550181600000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550183400000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550185200000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550187000000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550188800000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550190600000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550192400000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550194200000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550196000000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550197800000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550199600000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550201400000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550203200000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550205000000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550206800000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550208600000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550210400000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550212200000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550214000000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550215800000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550217600000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550219400000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550221200000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550223000000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550224800000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550226600000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550228400000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550230200000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550232000000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550233800000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550235600000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550237400000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550239200000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550241000000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550242800000, 'open': 87.0, 'close': 87.0, 'low': 87.0, 'high': 87.0}, {
  'timestmp': 1550244600000,
  'open': 87.0,
  'close': 87.0,
  'low': 87.0,
  'high': 87.0
}, {'timestmp': 1550246400000, 'open': 78.0, 'close': 81.0, 'low': 2.0, 'high': 99.0}, {
  'timestmp': 1550248200000,
  'open': 81.0,
  'close': 32.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1550250000000, 'open': 32.0, 'close': 46.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550251800000,
  'open': 46.0,
  'close': 78.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550253600000, 'open': 78.0, 'close': 30.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550255400000,
  'open': 30.0,
  'close': 89.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550257200000, 'open': 89.0, 'close': 35.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550259000000,
  'open': 35.0,
  'close': 47.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550260800000, 'open': 47.0, 'close': 58.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550262600000,
  'open': 58.0,
  'close': 27.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1550264400000, 'open': 27.0, 'close': 100.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550266200000,
  'open': 100.0,
  'close': 30.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550268000000, 'open': 30.0, 'close': 63.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550269800000,
  'open': 63.0,
  'close': 56.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550271600000, 'open': 56.0, 'close': 25.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550273400000,
  'open': 25.0,
  'close': 97.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550275200000, 'open': 83.0, 'close': 17.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550277000000,
  'open': 17.0,
  'close': 63.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1550278800000, 'open': 63.0, 'close': 59.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550280600000,
  'open': 59.0,
  'close': 27.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550282400000, 'open': 33.0, 'close': 93.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550284200000,
  'open': 93.0,
  'close': 18.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550286000000, 'open': 18.0, 'close': 54.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1550287800000,
  'open': 54.0,
  'close': 46.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550289600000, 'open': 46.0, 'close': 38.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550291400000,
  'open': 38.0,
  'close': 83.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1550293200000, 'open': 83.0, 'close': 17.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550295000000,
  'open': 28.0,
  'close': 74.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1550296800000, 'open': 74.0, 'close': 52.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550298600000,
  'open': 52.0,
  'close': 45.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550300400000, 'open': 45.0, 'close': 83.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550302200000,
  'open': 83.0,
  'close': 9.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550304000000, 'open': 9.0, 'close': 78.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1550305800000,
  'open': 78.0,
  'close': 42.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550307600000, 'open': 42.0, 'close': 37.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550309400000,
  'open': 37.0,
  'close': 73.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550311200000, 'open': 73.0, 'close': 12.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550313000000,
  'open': 12.0,
  'close': 81.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550314800000, 'open': 81.0, 'close': 42.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550316600000,
  'open': 42.0,
  'close': 54.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550318400000, 'open': 54.0, 'close': 62.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550320200000,
  'open': 62.0,
  'close': 30.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550322000000, 'open': 30.0, 'close': 79.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1550323800000,
  'open': 79.0,
  'close': 38.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550325600000, 'open': 38.0, 'close': 54.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550327400000,
  'open': 54.0,
  'close': 76.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1550329200000, 'open': 76.0, 'close': 12.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1550331000000,
  'open': 12.0,
  'close': 75.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1550332800000, 'open': 75.0, 'close': 35.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550334600000,
  'open': 35.0,
  'close': 48.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1550336400000, 'open': 48.0, 'close': 60.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550338200000,
  'open': 60.0,
  'close': 19.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550340000000, 'open': 19.0, 'close': 96.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550341800000,
  'open': 96.0,
  'close': 26.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550343600000, 'open': 26.0, 'close': 51.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1550345400000,
  'open': 51.0,
  'close': 67.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550347200000, 'open': 67.0, 'close': 26.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550349000000,
  'open': 26.0,
  'close': 87.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550350800000, 'open': 95.0, 'close': 15.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1550352600000,
  'open': 23.0,
  'close': 67.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1550354400000, 'open': 67.0, 'close': 47.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550356200000,
  'open': 47.0,
  'close': 39.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550358000000, 'open': 39.0, 'close': 84.0, 'low': 1.0, 'high': 98.0}, {
  'timestmp': 1550359800000,
  'open': 84.0,
  'close': 18.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550361600000, 'open': 18.0, 'close': 63.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550363400000,
  'open': 63.0,
  'close': 48.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1550365200000, 'open': 48.0, 'close': 38.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550367000000,
  'open': 38.0,
  'close': 75.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1550368800000, 'open': 75.0, 'close': 8.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550370600000,
  'open': 8.0,
  'close': 71.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550372400000, 'open': 71.0, 'close': 46.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550374200000,
  'open': 46.0,
  'close': 56.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550376000000, 'open': 56.0, 'close': 62.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550377800000,
  'open': 74.0,
  'close': 21.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550379600000, 'open': 21.0, 'close': 72.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550381400000,
  'open': 72.0,
  'close': 27.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550383200000, 'open': 27.0, 'close': 52.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550385000000,
  'open': 52.0,
  'close': 66.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550386800000, 'open': 66.0, 'close': 18.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550388600000,
  'open': 18.0,
  'close': 96.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550390400000, 'open': 96.0, 'close': 38.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1550392200000,
  'open': 38.0,
  'close': 58.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550394000000, 'open': 58.0, 'close': 57.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550395800000,
  'open': 57.0,
  'close': 28.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550397600000, 'open': 28.0, 'close': 88.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550399400000,
  'open': 88.0,
  'close': 23.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550401200000, 'open': 23.0, 'close': 63.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1550403000000,
  'open': 63.0,
  'close': 46.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550404800000, 'open': 46.0, 'close': 28.0, 'low': 2.0, 'high': 99.0}, {
  'timestmp': 1550406600000,
  'open': 28.0,
  'close': 79.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1550408400000, 'open': 79.0, 'close': 24.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550410200000,
  'open': 24.0,
  'close': 74.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550412000000, 'open': 74.0, 'close': 54.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550413800000,
  'open': 54.0,
  'close': 47.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1550415600000, 'open': 47.0, 'close': 75.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550417400000,
  'open': 75.0,
  'close': 9.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1550419200000, 'open': 9.0, 'close': 68.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550421000000,
  'open': 68.0,
  'close': 57.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550422800000, 'open': 57.0, 'close': 38.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550424600000,
  'open': 38.0,
  'close': 75.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550426400000, 'open': 75.0, 'close': 10.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550428200000,
  'open': 10.0,
  'close': 87.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550430000000, 'open': 87.0, 'close': 40.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550431800000,
  'open': 40.0,
  'close': 51.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550433600000, 'open': 51.0, 'close': 68.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550435400000,
  'open': 68.0,
  'close': 20.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550437200000, 'open': 20.0, 'close': 89.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1550439000000,
  'open': 89.0,
  'close': 30.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550440800000, 'open': 30.0, 'close': 59.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1550442600000,
  'open': 59.0,
  'close': 62.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550444400000, 'open': 62.0, 'close': 25.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550446200000,
  'open': 25.0,
  'close': 75.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550448000000, 'open': 75.0, 'close': 33.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550449800000,
  'open': 33.0,
  'close': 45.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550451600000, 'open': 45.0, 'close': 57.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550453400000,
  'open': 57.0,
  'close': 16.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550455200000, 'open': 16.0, 'close': 83.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550457000000,
  'open': 83.0,
  'close': 28.0,
  'low': 1.0,
  'high': 98.0
}, {'timestmp': 1550458800000, 'open': 28.0, 'close': 48.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550460600000,
  'open': 48.0,
  'close': 61.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550462400000, 'open': 61.0, 'close': 20.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550464200000,
  'open': 20.0,
  'close': 83.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550466000000, 'open': 83.0, 'close': 30.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1550467800000,
  'open': 30.0,
  'close': 60.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1550469600000, 'open': 60.0, 'close': 70.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550471400000,
  'open': 70.0,
  'close': 25.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550473200000, 'open': 25.0, 'close': 75.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550475000000,
  'open': 75.0,
  'close': 27.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550476800000, 'open': 27.0, 'close': 60.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550478600000,
  'open': 51.0,
  'close': 60.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1550480400000, 'open': 60.0, 'close': 23.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550482200000,
  'open': 23.0,
  'close': 83.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550484000000, 'open': 83.0, 'close': 29.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1550485800000,
  'open': 29.0,
  'close': 47.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550487600000, 'open': 47.0, 'close': 51.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550489400000,
  'open': 51.0,
  'close': 15.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550491200000, 'open': 15.0, 'close': 89.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1550493000000,
  'open': 89.0,
  'close': 26.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1550494800000, 'open': 26.0, 'close': 47.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550496600000,
  'open': 55.0,
  'close': 70.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550498400000, 'open': 70.0, 'close': 21.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550500200000,
  'open': 21.0,
  'close': 99.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550502000000, 'open': 88.0, 'close': 26.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550503800000,
  'open': 26.0,
  'close': 63.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550505600000, 'open': 63.0, 'close': 70.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550507400000,
  'open': 70.0,
  'close': 30.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550509200000, 'open': 30.0, 'close': 90.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550511000000,
  'open': 90.0,
  'close': 22.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550512800000, 'open': 22.0, 'close': 57.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550514600000,
  'open': 57.0,
  'close': 53.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550516400000, 'open': 53.0, 'close': 34.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550518200000,
  'open': 34.0,
  'close': 83.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550520000000, 'open': 83.0, 'close': 23.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1550521800000,
  'open': 23.0,
  'close': 67.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1550523600000, 'open': 67.0, 'close': 53.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1550525400000,
  'open': 53.0,
  'close': 34.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550527200000, 'open': 34.0, 'close': 78.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550529000000,
  'open': 78.0,
  'close': 22.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1550530800000, 'open': 16.0, 'close': 60.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550532600000,
  'open': 60.0,
  'close': 44.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1550534400000, 'open': 44.0, 'close': 23.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550536200000,
  'open': 23.0,
  'close': 84.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550538000000, 'open': 84.0, 'close': 12.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550539800000,
  'open': 12.0,
  'close': 64.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1550541600000, 'open': 70.0, 'close': 50.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550543400000,
  'open': 50.0,
  'close': 29.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550545200000, 'open': 29.0, 'close': 83.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550547000000,
  'open': 83.0,
  'close': 23.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550548800000, 'open': 23.0, 'close': 59.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550550600000,
  'open': 59.0,
  'close': 58.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1550552400000, 'open': 58.0, 'close': 33.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1550554200000,
  'open': 33.0,
  'close': 75.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550556000000, 'open': 75.0, 'close': 29.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1550557800000,
  'open': 29.0,
  'close': 71.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550559600000, 'open': 71.0, 'close': 55.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550561400000,
  'open': 55.0,
  'close': 40.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1550563200000, 'open': 40.0, 'close': 78.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550565000000,
  'open': 78.0,
  'close': 18.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550566800000, 'open': 18.0, 'close': 65.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550568600000,
  'open': 65.0,
  'close': 48.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1550570400000, 'open': 48.0, 'close': 35.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1550572200000,
  'open': 35.0,
  'close': 73.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550574000000, 'open': 73.0, 'close': 3.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550575800000,
  'open': 3.0,
  'close': 79.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550577600000, 'open': 79.0, 'close': 54.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550579400000,
  'open': 54.0,
  'close': 44.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550581200000, 'open': 44.0, 'close': 82.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550583000000,
  'open': 90.0,
  'close': 8.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550584800000, 'open': 8.0, 'close': 75.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550586600000,
  'open': 75.0,
  'close': 39.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550588400000, 'open': 39.0, 'close': 47.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550590200000,
  'open': 47.0,
  'close': 85.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1550592000000, 'open': 85.0, 'close': 19.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550593800000,
  'open': 19.0,
  'close': 78.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550595600000, 'open': 71.0, 'close': 34.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550597400000,
  'open': 34.0,
  'close': 42.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1550599200000, 'open': 42.0, 'close': 62.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550601000000,
  'open': 62.0,
  'close': 6.0,
  'low': 2.0,
  'high': 100.0
}, {'timestmp': 1550602800000, 'open': 6.0, 'close': 79.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550604600000,
  'open': 79.0,
  'close': 35.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550606400000, 'open': 35.0, 'close': 38.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550608200000,
  'open': 38.0,
  'close': 79.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1550610000000, 'open': 67.0, 'close': 1.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1550611800000,
  'open': 1.0,
  'close': 67.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550613600000, 'open': 67.0, 'close': 49.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550615400000,
  'open': 37.0,
  'close': 35.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550617200000, 'open': 35.0, 'close': 66.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550619000000,
  'open': 66.0,
  'close': 18.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550620800000, 'open': 18.0, 'close': 77.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1550622600000,
  'open': 77.0,
  'close': 38.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550624400000, 'open': 38.0, 'close': 57.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550626200000,
  'open': 49.0,
  'close': 80.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550628000000, 'open': 73.0, 'close': 9.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550629800000,
  'open': 9.0,
  'close': 80.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550631600000, 'open': 80.0, 'close': 49.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550633400000,
  'open': 49.0,
  'close': 41.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550635200000, 'open': 41.0, 'close': 62.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550637000000,
  'open': 62.0,
  'close': 13.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550638800000, 'open': 13.0, 'close': 78.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550640600000,
  'open': 78.0,
  'close': 49.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550642400000, 'open': 49.0, 'close': 49.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550644200000,
  'open': 49.0,
  'close': 80.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550646000000, 'open': 80.0, 'close': 15.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550647800000,
  'open': 15.0,
  'close': 82.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550649600000, 'open': 82.0, 'close': 47.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1550651400000,
  'open': 36.0,
  'close': 36.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550653200000, 'open': 45.0, 'close': 69.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550655000000,
  'open': 69.0,
  'close': 11.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550656800000, 'open': 11.0, 'close': 81.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550658600000,
  'open': 81.0,
  'close': 43.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550660400000, 'open': 43.0, 'close': 53.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550662200000,
  'open': 53.0,
  'close': 69.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550664000000, 'open': 69.0, 'close': 8.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550665800000,
  'open': 8.0,
  'close': 74.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550667600000, 'open': 74.0, 'close': 37.0, 'low': 1.0, 'high': 99.0}, {
  'timestmp': 1550669400000,
  'open': 37.0,
  'close': 60.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550671200000, 'open': 60.0, 'close': 73.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550673000000,
  'open': 73.0,
  'close': 10.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550674800000, 'open': 10.0, 'close': 89.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550676600000,
  'open': 89.0,
  'close': 40.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550678400000, 'open': 40.0, 'close': 47.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550680200000,
  'open': 47.0,
  'close': 70.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1550682000000, 'open': 70.0, 'close': 12.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550683800000,
  'open': 12.0,
  'close': 86.0,
  'low': 1.0,
  'high': 99.0
}, {'timestmp': 1550685600000, 'open': 86.0, 'close': 36.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550687400000,
  'open': 36.0,
  'close': 58.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550689200000, 'open': 58.0, 'close': 79.0, 'low': 1.0, 'high': 100.0}, {
  'timestmp': 1550691000000,
  'open': 79.0,
  'close': 27.0,
  'low': 1.0,
  'high': 100.0
}, {'timestmp': 1550692800000, 'open': 27.0, 'close': 76.0, 'low': 2.0, 'high': 100.0}, {
  'timestmp': 1550694600000,
  'open': 76.0,
  'close': 22.0,
  'low': 1.0,
  'high': 99.0
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
