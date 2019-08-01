export enum ITEM_TYPE {
  'single' = 1, // Единичные значения параметров
  'series' = 2, // Ряды данных
  'events' = 3, // Лента событий
  'interval' = 5, // Значения параметров на заданном интервале
  'table' = 6, // Таблица значений параметров
  'custom' = 7, // Поле не требующее обработки сервера
}

export const ITEM_TYPE_ITOS = {
  1: 'single',
  2: 'series',
  3: 'events',
  5: 'interval',
  6: 'table',
};


// нет контроля, норма, отклонение, критическое, хз todo Скорей всего нужно перенести в css
export const STATE_COLORS = ['#FFFAFA', '#00e4c8', '#ffd452', '#c95e46', '#f71800', '#008B8B', '#5F9EA0'];

// Типы параметров
export enum PARAM_TYPE {
  'signal' = 1, // сигнальный
  'value' = 2, // мгновенное значение
  'increment' = 3, // нарастающий итог

  'custom_string' = 11,
}

export const PARAM_TYPE_ITOS = {
  1: 'param_type_signal',
  2: 'param_type_value',
  3: 'param_type_increment'
};

// Типы значений
export enum VALUE_TYPE {
  'absolute' = 1,
  'relative' = 2,
  'signal' = 3,
  'increment' = 4,
}


// Возможные пересечения типа параметров и типа значения
export const INTERVAL_PARAM_VALUE = {
  [PARAM_TYPE.signal]: [VALUE_TYPE.signal],
  [PARAM_TYPE.value]: [VALUE_TYPE.absolute, VALUE_TYPE.relative],
  [PARAM_TYPE.increment]: [VALUE_TYPE.absolute, VALUE_TYPE.relative, VALUE_TYPE.increment]
};

export const SINGLE_PARAM_VALUE = {
  [PARAM_TYPE.signal]: [VALUE_TYPE.signal],
  [PARAM_TYPE.value]: [VALUE_TYPE.absolute, VALUE_TYPE.relative],
  [PARAM_TYPE.increment]: [VALUE_TYPE.absolute, VALUE_TYPE.relative]
};


export interface Border {
  state: { id: number, name: string, color: string, comment: string };
  intervals: { from: number, to: number }[];
}


export interface ItemSingle extends IWidgetParam {
  value: any;
  data: SingleValue;
}

export interface ItemInterval extends IWidgetParam {
  value: any;
  data: IntervalValue;
}

export interface ItemSeries extends IWidgetParam {
  value: any;
  data: SeriesValue;
}

export interface ItemTable extends IWidgetParam {
  values: TableValues;
}

export interface ItemCustom extends IWidgetParam {
  value: string;
}

export interface ItemParent {
  [k: string]: WidgetItem | WidgetItem[] | ParamConfig;
}

export type WidgetItem = any | ItemSingle | ItemTable | ItemSeries | ItemInterval | ItemParent | EventValues;

export interface WidgetItems {
  [k: string]: WidgetItem;
}


export enum SiteTheme {
  'dark' = 'dark',
  'light' = 'light'
}


export type IWidgetParamTable = IWidgetParam[][];


// структура для конфигуратора
export interface ParamConfigurator {
  name: string;
  title: string;
  itemType: ITEM_TYPE;
  paramType: PARAM_TYPE;
  value?: IWidgetParam; // Для обычных значений
  values?: IWidgetParamTable; // Для табличных значений
  items?: ParamConfigurator[];
  isArray?: boolean;
  maxItems?: number;
  parent: ParamConfigurator;
  views?: string[]; // Варианты представлений параметра
  viewConfig?: IWidgetParamConfig;
  config?: ParamConfigInterval | ParamConfigSeries | ParamConfigSingle | ParamConfigEvents | ParamConfigCustom;
  generateConfig?: GenerateConfig;
}

export interface GenerateConfig extends GenerateConfigItem {
  count?: number;
  items?: GenerateConfigItem[];
  pictureId?: boolean;

  // Для таблиц
  columns?: number;
  rows?: number;
  visibleRow?: boolean;
  visibleCol?: boolean;
}

export interface GenerateConfigItem {
  // Для всех параметров
  pageLink?: boolean;
  isOnline?: boolean;
  editable?: boolean;
  data?: boolean;
  param?: boolean;
  isIcon?: boolean;
  iconSet?: boolean;

  state?: number;

  // Для мгновенных
  borders?: boolean;

  // Для кастомных
  paragraphCount?: number;
}

// @ts-ignore
export enum PARAM_STATE {
  'falsevalue' = -1,
  'none' = 0,
  'success' = 1,
  'warning' = 2,
  'error' = 3,
}

export const PARAM_STATE_INT = {'-1': 'falsevalue', 0: 'none', 1: 'success', 2: 'warning', 3: 'error'};

export interface IWidgetDeviceParam {
  controller?: { id: number, serialnumber: string, isOnline?: boolean };
  object?: { id: number, shortname: string, fullname: string };
  param: { id?: number, calc?: boolean, name?: string, type?: PARAM_TYPE, value?: number, measure?: { title: string, unit: string } };
  zone?: { name: string };
  state?: { id?: number, name?: string, comment?: string };
}


// Структура для хранения информации о параметры для виджетов
export interface IWidgetParam {
  id?: number;
  device: IWidgetDeviceParam;
  widgetId: number;
  refName: string;
  itemType: ITEM_TYPE;
  title: string;
  config: ParamConfig;
  viewConfig?: IWidgetParamConfig;
  icons?: {
    falsevalue: string;
    none: string;
    success: string;
    warning: string;
    error: string;
  };
  custom?: any;
  borders?: Border[];
  dashboardLink?: { dashname?: string, id: number };
  isEditing?: boolean; // Параметр, обозначающий, что поле редактируется
  canEditable?: boolean; // Может ли параметр редактироваться
}


export interface IWidgetParamConfig {
  formatValue?: string;
  view?: string;
  rows?: number;
  cols?: number;
  rowsName?: string[];
  colsName?: string[];
  visibleRow?: boolean;
  visibleCol?: boolean;
}


export enum SeriesDuration {
  'day' = 'day',
  'week' = 'week',
  'month' = 'month'
}

// Тип ленты событий
export enum LineType {
  'eventlog' = 1,
  'setvaluelog' = 2,
  'commandlog' = 3
}

export enum ChartTypes {
  'lineChart' = 'lineChart',
  'candlestickBarChart' = 'candlestickBarChart',
  'stackedAreaChart' = 'stackedAreaChart',
  'histogramChart' = 'histogramChart',
  'pieChart' = 'pieChart',
  'intervalPieChart' = 'intervalPieChart'
}

export interface ParamConfigSingle {
  valueType?: number;
}


export interface ParamConfigInterval {
  dailyRange: string;
  stateMap: boolean;
  valueType: number;
  duration: SeriesDuration;
  count: number;
}


export interface ParamConfigSeries {
  duration?: SeriesDuration;  // временной интервал
  count?: number;  // смещение временного интервала от текущей даты в единицах <duration> (1 day, 2 week ...)
  charttype?: ChartTypes;
  generator?: boolean;
}

export interface ParamConfigEvents {
  lineType?: number;  // События, команды, уставки
  attrList?: string[];       // Список и относительное расположение выдаваемых атрибутов
  titleList?: string[];        // Список и относительное расположение заголовков выдаваемых атрибутов
  size?: number;     //  Максимальное количество выдаваемых строк в ленте
  objectIds?: string[];         // Идентификаторы объектов
  eventIds?: string[];          // Идентификаторы событий
  commands?: string[];          // Идентификаторы команд
}


export interface ParamConfigCustom {
  value?: string;
  type?: ParamConfigCustomType;
}

export enum ParamConfigCustomType {
  'string',
}

export type ParamConfig =
  ParamConfigInterval
  | ParamConfigSeries
  | ParamConfigSingle
  | ParamConfigEvents
  | ParamConfigCustom;


/**
 значение  - value
 карта состояний - states
 карта значений - value
 */
export interface SingleValue {
  locked: boolean;
  manually: boolean;
  date: number;
  value: any;
  state: ParamState;
}


/**
 среднее значение - value
 минимальное значение - min
 максимальное значение - max
 карта состояний - states
 среднее абсолютное значение - value
 среднее относительное значение – percent
 последнее абсолютное значение - value
 последнее относительное значение - percent
 */
export interface IntervalValue {
  value: number; // числовое значение, либо 1,0
  percent: number; //  relative и increment
  min: number; //  absolute
  max: number; //  absolute
  states: ParamStates[]; //  absolute signal
  state: ParamState;
  beginInterval: number;
  endInterval: number;
  switchCount: number; // signal
}


export type SeriesValue = Array<SeriesCandleValue | SeriesLineValue>;

// График свечек
export interface SeriesCandleValue {
  close: number;
  high: number;
  low: number;
  open: number;
  timestmp: number;
}

// Все остальные графики
export interface SeriesLineValue {
  value: number;
  timestmp: number;
}

export type TableValues = Array<Array<ItemSingle>>;

// События

export interface CustomValue {
  value: string;
}

/**
 * Интерфейс для ленты событий с типом 1
 */
export interface EventValue {
  shortname: string;
  serialnumber: string;
  eventid: number;
  name: string;
  timestmp: number;
  msg: string;
}

export interface EventValues {
  data: {
    rowList: Array<EventValue>;
  };
  config: ParamConfigEvents;
}

// У корневых элементов необходимо указать item_type
export interface WidgetParam {
  title: string;
  item_type: ITEM_TYPE;
  param_type?: PARAM_TYPE;
  items?: WidgetParamsChildren | WidgetArrayParam[];
  views?: string[]; // Перечисление возможных видов параметра
  available?: any[]; // Ограничение для генератора случайных чисел
}

export interface WidgetParamChildren {
  title: string;
  item_type?: ITEM_TYPE;
  param_type?: PARAM_TYPE;
  items?: WidgetParamsChildren | WidgetArrayParam[];
  views?: string[]; // Перечисление возможных видов параметра
  available?: any[]; // Ограничение для генератора случайных чисел
}

export interface WidgetArrayParam {
  max?: number;
  item_type?: ITEM_TYPE;
  param_type?: PARAM_TYPE;
}

export interface WidgetParamsChildren {
  [k: string]: WidgetParamChildren;
}

export interface WidgetParams {
  [k: string]: WidgetParam;
}

export interface WidgetSizePosition {
  x?: number;
  y?: number;
  w: number;
  h: number;
}

export interface WidgetSize {
  sm: WidgetSizePosition;
  lg: WidgetSizePosition;
  mobile: WidgetSizePosition;
}

export interface ParamState {
  color: string;
  comment: string;
  idIcon: number;
}

export interface ParamStates {
  interval: number;
  state: {
    id: number;
    name: string;
    color: string;
    comment: string;
  };
}


// В коде конфиг ввиде объекта
export interface IWidget {
  id?: number;
  widgetclass: IWidgetClass;
  dashboard: ServiceDashboardClass;
  title: string;
  conflict?: boolean;
  hidden?: boolean;
  config?: IWidgetConfig;
}

export interface ServiceDashboardClass {
  id: number;
  dashname?: string;
  hidden?: boolean;
  objrubric?: Objrubric;
  favorite?: number
}


export interface Objrubric {
  id?: number;
  shortname?: string;
  fullname?: string;
  comment?: string;
  objrubric?: Objrubric;
}


export interface IWidgetConfig {
  widget: {
    picture: {
      setId: number;
      pictureId: number
    },
    floatingHeader?: boolean;
  };
  position: WidgetSize;
  items: { [k: string]: IWidgetParamConfig };
}

export interface IWidgetClass {
  id: number;
  storeId?: string; // ссылка на файл
  version?: string;
  name?: string;
  description?: string;
}


export type WidgetDataList = Array<SingleValue | IntervalValue>;

export interface WidgetSocketData {
  dataList: WidgetDataList;
  exwidget: number;
}

export interface WidgetSocketDataCommand {
  command: string;
  widgetDataList: WidgetSocketData[];
  message?: string;
  error?: string;
}


// Обертка для среды разработки
export const Component = (opts) => {
  return (component) => {
    return component;
  };
};
