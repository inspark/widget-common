export enum ITEM_TYPE {
  'single' = 1, // Единичные значения параметров
  'series' = 2, // Ряды данных
  'events' = 3, // Лента событий
  'sysinfo' = 4, // Системные событий
  'interval' = 5, // Значения параметров на заданном интервале
  'table' = 6, // Таблица значений параметров
  'custom' = 7, // Поле не требующее обработки сервера
  'object' = 8, // Объект
  'objstate' = 9, // Объект
  'liftinfo' = 10, // Классификатор + объекты
}

// нет контроля, норма, отклонение, критическое, хз todo Скорей всего нужно перенести в css
export const STATE_COLORS = ['#FFFAFA', '#00e4c8', '#ffd452', '#c95e46', '#f71800', '#008B8B', '#5F9EA0'];

// Типы параметров
export enum PARAM_TYPE {
  'signal' = 1, // сигнальный
  'value' = 2, // мгновенное значение
  'increment' = 3, // нарастающий итог
  'pulse_counter' = 4, // счетчик импульсов
  'string' = 5, // строковый
  'image' = 6, // изображение
  'text' = 7, // текстовый
  'coordinates' = 8, // Координаты

  'custom_string' = 11,
  'custom_archer' = 12,
  'custom_external' = 13, // загрузка параметров через внешний файл
  'custom_file' = 14, // загрузка файлов
  'custom_json' = 15, // Текст JSON
  'custom_select' = 16, // Список
  'custom_forge' = 17, // Работа с Autodesk Forge
  'custom_dashboard' = 18,
  'custom_objstate' = 19,


  // группа виртуальных объектов для работы конфигуратора
  'virtual_object' = 90,

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


export interface ItemSingle extends IWidgetParam<ParamConfigSingle> {
  value: any;
  data: SingleValue;
}

export interface ItemInterval extends IWidgetParam<ParamConfigInterval> {
  value: any;
  data: IntervalValue;
}

export interface ItemSysInfo extends IWidgetParam<ParamConfigSysInfo> {
  data: SysInfoValue;
}

export interface ItemLiftInfo extends IWidgetParam<ParamConfigLiftInfo> {
  data: LiftInfoValue;
}

export interface ItemSeries extends IWidgetParam<ParamConfigSeries> {
  value: any;
  data: SeriesValue;
}

export interface ItemTable extends IWidgetParam {
  values: TableValues;
}

export interface ItemCustom extends IWidgetParam<ParamConfigCustom> {
  value: any;
  files?: any; //  For Archer
}

export interface ItemParent {
  [k: string]: WidgetItem | WidgetItem[] | ParamConfig;
}

export type WidgetItem = any | ItemSingle | ItemTable | ItemSeries | ItemInterval | ItemParent
  | EventValues | SysInfoValue | ObjStateValues | LiftInfoValue;

export interface WidgetItems {
  [k: string]: WidgetItem;
}


export enum SiteTheme {
  'dark' = 'dark',
  'light' = 'light'
}


export type IWidgetParamTable<TConfig = any> = IWidgetParam<TConfig>[][];

// структура для конфигуратора
export interface ParamConfigurator<TConfig = any> {
  name: string;
  title: string;
  itemType: ITEM_TYPE;
  paramType: PARAM_TYPE;
  value?: IWidgetParam<TConfig>; // Для обычных значений
  values?: IWidgetParamTable<TConfig>; // Для табличных значений
  items?: ParamConfigurator[];
  isArray?: boolean;
  maxItems?: number;
  parent: ParamConfigurator;
  views?: string[]; // Варианты представлений параметра
  viewConfig?: IWidgetParamConfig;
  config?: ParamConfigInterval | ParamConfigSeries | ParamConfigSingle | ParamConfigEvents | ParamConfigCustom;
  filter?: any;
  generateConfig?: GenerateConfig;
  param?: WidgetParamChildren;
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


  // Для событий
  duration?: SeriesDuration;
}

export interface GenerateConfigItem {
  // Для всех параметров
  pageLink?: boolean;
  editable?: boolean;
  data?: boolean;
  param?: boolean;
  locked?: boolean;
  isIcon?: boolean;
  iconSet?: boolean;
  title?: string;
  view?: string; // Тип отображения
  isWorkingDevice?: boolean;
  state?: number;
  ctrability?: boolean;
  value?: any;


  // Для мгновенных
  borders?: boolean;

  // Для кастомных
  paragraphCount?: number;


  // устроства
  isOnline?: boolean;

  // Для арчера
  files?: { [k: string]: string };
  archer?: any;

  // для списка
  selectValue?: number | string;
}

// @ts-ignore
export enum PARAM_STATE {
  'falsevalue' = -1,
  'none' = 0,
  'success' = 1,
  'warning' = 2,
  'error' = 3,
  'maintenance' = 4,

}

export const PARAM_STATE_INT = [];

PARAM_STATE_INT['-1'] = 'falsevalue';
PARAM_STATE_INT[0] = 'none';
PARAM_STATE_INT[1] = 'success';
PARAM_STATE_INT[2] = 'warning';
PARAM_STATE_INT[3] = 'error';
PARAM_STATE_INT[4] = 'maintenance';


export interface IWidgetDeviceParam {
  controller?: { id: number, serialnumber: string, isOnline?: boolean };
  object?: { id: number, shortname: string, fullname: string, timezone: number, latitude: number, longitude: number };
  param: IWidgetDeviceParamData;
  zone?: { name: string };
  isWorking?: boolean;
  state?: { id?: number, name?: string, comment?: string };
  sysState?: {
    comment: string;
    id: number;
    color: string;
    name: string
  };
}

export interface IWidgetDeviceParamData {
  id?: number;
  calc?: boolean;
  name?: string;
  type?: PARAM_TYPE;
  value?: any;
  valueDate?: string;
  measure?: IWidgetDeviceParamMeasure;
  ctrability?: boolean;
}

export interface IWidgetDeviceParamMeasure{
  title: string;
  unit: string;
  id: number;
  icon: IWidgetIconInfo;
}

// Структура для хранения информации о параметры для виджетов
export interface IWidgetParam<TConfig = any> {
  id?: number;
  device: IWidgetDeviceParam;
  calc?: boolean;
  widgetId: number;
  refName: string;
  itemType: ITEM_TYPE;
  paramType?: PARAM_TYPE;
  title: string;
  config: TConfig;
  filter?: any;
  viewConfig?: IWidgetParamConfig;
  icons?: {
    falsevalue: string;
    none: string;
    success: string;
    warning: string;
    error: string;
  };
  files?: any;
  custom?: any;
  custom_data?: any;
  borders?: Border[];
  dashboardLink?: { dashname?: string, id?: number };
  isEditing?: boolean; // Параметр, обозначающий, что поле редактируется
  canEditable?: boolean; // Может ли параметр редактироваться
}

export type ColumnWidthType = 'auto' | 'fit-content' | 'fix';

export type ColumnSizeUnity = 'px' | '%';

export interface IRowConfig {
  name: string;
}

export interface IColConfig {
  name: string;
  widthType?: ColumnWidthType;
  size?: { value: number; unit: ColumnSizeUnity };
}

export interface IWidgetParamConfig {
  formatValue?: string;
  view?: string;
  /**
   * @deprecated Use table.rowConfig
   */
  rows?: number;
  /**
   * @deprecated Use table.rowConfig
   */
  cols?: number;
  /**
   * @deprecated Use table.rowConfig
   */
  rowsName?: string[]; // @deprecated
  /**
   * @deprecated Use table.colConfig
   */
  colsName?: string[]; // @deprecated
  /**
   * @deprecated Use table.visibleRow
   */
  visibleRow?: boolean; // @deprecated
  /**
   * @deprecated Use table.visibleCol
   */
  visibleCol?: boolean; // @deprecated
  table?: {
    rowConfig?: IRowConfig[];
    colConfig?: IColConfig[];
    visibleRow?: boolean;
    visibleCol?: boolean;
    rows?: number;
    cols?: number;
  };
  files?: { [k: string]: any };
  selectValue?: number | string;

  name?: string; // Для хранение внутреннего названия
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

export enum ChartViews {
  'lineChart' = 'lineChart',
  'lineWeekend' = 'lineWeekend',
  'candlestickBarChart' = 'candlestickBarChart',
  'stackedAreaChart' = 'stackedAreaChart',
  'histogramChart' = 'histogramChart',
  'pieChart' = 'pieChart',
}


export const ChartViewToType = {
  [ChartViews.lineChart]: ChartTypes.lineChart,
  [ChartViews.candlestickBarChart]: ChartTypes.candlestickBarChart,
  [ChartViews.stackedAreaChart]: ChartTypes.stackedAreaChart,
  [ChartViews.histogramChart]: ChartTypes.histogramChart,
  [ChartViews.lineWeekend]: ChartTypes.lineChart,
};

export const ChartTypeToView = {
  [ChartTypes.lineChart]: ChartViews.lineChart,
  [ChartTypes.candlestickBarChart]: ChartViews.candlestickBarChart,
  [ChartTypes.stackedAreaChart]: ChartViews.stackedAreaChart,
  [ChartTypes.histogramChart]: ChartViews.histogramChart,
  [ChartTypes.lineChart]: ChartViews.lineWeekend,
};

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
  viewtype?: ChartViews;
  generator?: boolean;
}

export interface ParamConfigEvents {
  lineType?: number;  // События, команды, уставки
  attrList?: string[];       // Список и относительное расположение выдаваемых атрибутов
  titleList?: string[];        // Список и относительное расположение заголовков выдаваемых атрибутов
  objectIds?: string[];         // Идентификаторы объектов
  eventIds?: string[];          // Идентификаторы событий
  commands?: string[];          // Идентификаторы команд

  // Можно использовать либо этот параметр
  size?: number;     //  Максимальное количество выдаваемых строк в ленте

  // Либо этот
  duration?: SeriesDuration;  // временной интервал
}

export interface ParamConfigObjState {
  rubricId: number;
}


export interface ParamConfigCustom {
  value?: string;
  type?: PARAM_TYPE;
}

export interface ParamConfigSysInfo {
  rubricId: number;
}

export interface ParamConfigLiftInfo {
  deviceClassifierId: number;
  objectIds: number[];
}

export type ParamConfig =
  ParamConfigInterval
  | ParamConfigSeries
  | ParamConfigSingle
  | ParamConfigEvents
  | ParamConfigCustom
  | ParamConfigSysInfo
  | ParamConfigLiftInfo;


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
  unit: { id: number, name: string, available: boolean, unavailabilityDate: number };
  isProcessing?: boolean;
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
  valueMap: Array<{ interval: number; value: number }>;
}

export interface ControllersInfo {
  total: number;
  online: number;
  offline: number;
}

export interface LiftsInfo {
  total: number;
  online: number;
  offline: number;
}

export interface SysInfoValue {
  date: number;
  controllersInfo: ControllersInfo;
}

export interface LiftInfoValue {
  date: number;
  liftsInfo: LiftsInfo;
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

export interface ObjStateValuesState {
  id: number;
  name: string;
  count: number;
}

export interface ObjStateValues {
  data: {
    date: number;
    states: ObjStateValuesState[];
  };
  config: ParamConfigObjState;
}

// У корневых элементов необходимо указать item_type
export interface WidgetParam {
  title: string;
  item_type: ITEM_TYPE;
  param_type?: PARAM_TYPE;
  items?: WidgetParamsChildren | WidgetParamsChildren[] | WidgetParamChildren[];
  views?: string[]; // Перечисление возможных видов параметра
  available?: any[]; // Ограничение для генератора случайных чисел
  custom_data?: any; // Пользовательские данные, которые пробрасываются напрямую
}

export interface WidgetParamChildren {
  title?: string;
  item_type?: ITEM_TYPE;
  param_type?: PARAM_TYPE;
  items?: WidgetParamsChildren | WidgetParamsChildren[] | WidgetParamChildren[];
  views?: string[]; // Перечисление возможных видов параметра
  available?: any[]; // Ограничение для генератора случайных чисел
  custom_data?: any; // Пользовательские данные, которые пробрасываются напрямую
  viewConfig?: IWidgetParamConfig;
  max?: number;
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

export enum WidgetCustomFieldType {
  boolean,
  dashboardLink,
  string
}

export interface WidgetCustomField {
  name: string;
  type: WidgetCustomFieldType;
}

export interface WidgetSize {
  sm: WidgetSizePosition;
  lg: WidgetSizePosition;
  slg?: WidgetSizePosition;
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
export interface IWidget<TDashboard = ServiceDashboardClass> {
  id?: number;
  widgetclass: IWidgetClass;
  dashboard: TDashboard;
  title: string;
  conflict?: boolean;
  hidden?: boolean;
  config?: IWidgetConfig;
  path?: string; // Путь при загрузке виджета(для дашей которые загружаются в дашах)
  /**
   * Format: int32
   * @description Порядок размещения в рамках одного дашборда (порядок загрузки)
   */
  placement?: number;
  /**
   * Format: date-time
   * @description Дата конфигурирования
   */
  configdate?: string;
  /**
   * Format: int32
   * @description Координата X начального положения конкретног виджета в сетке
   */
  posx?: number;
  /**
   * Format: int32
   * @description Координата Y начального положения конкретног виджета в сетке
   */
  posy?: number;
  /** @description Признак наличия конфликта, нужна ручная настройка */
  /**
   * Format: int32
   * @description Ширина начального положения виджета в сетке
   */
  width?: number;
  /**
   * Format: int32
   * @description Высота начального положения виджета в сетке
   */
  height?: number;
  /** @description Настройки внутреннего представления виджета в формате json (например substitution, valformat) */
  /**
   * Format: date-time
   * @description Дата создания записи
   */
  createdate?: string;
  /**
   * Format: date-time
   * @description Дата последнего изменения записи
   */
  lastdate?: string;
  icon?: IWidgetIconInfo;
}

export interface IWidgetIconInfo {
  /**
   * Format: int32
   * @description Идентификатор иконки
   */
  id?: number;
  /** @description Наименование иконки */
  name?: string;
  iconset?: IWidgetIconSetInfo;
  /** @description Путь к файлу в локальном хранилище */
  filepath?: string;
}

/** @description Набор изображений */
export interface IWidgetIconSetInfo {
  /**
   * Format: int32
   * @description Идентификатор
   */
  id?: number;
  /** @description Наименование */
  name: string;
  /**
   * Format: int32
   * @description Тип файлов, включаемых в набор (1 - иконка, 2 - картинка, 3 - видео)
   */
  imagetype: number;
}

export enum DashboardType {
  WEB = 'WEB',
  MOBILE = 'MOBILE',
  ANALYTIC = 'ANALYTIC',
}

export interface ServiceDashboardClass<TConfig = string> {
  /**
   * Format: int32
   * @description Идентификатор
   */
  id?: number;
  /** @description Наименование */
  dashname: string;
  /** @description Признак скрытого дашборда (не показывается) */
  hidden?: boolean;
  objrubric: Objrubric;
  /** @description Конфигурация для отображения дашборда (структура - ответственность клиента) */
  config?: TConfig;
  /**
   * @description Тип дашборда, WEB - для ЛК, MOBILE - для мобильного клиента)
   * @enum {string}
   */
  type: DashboardType;
  icon?: IWidgetIconInfo;
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
    picture?: {
      setId?: number;
      pictureId?: number
    },
    floatingHeader?: boolean;
  };
  position?: WidgetSize;
  items: { [k: string]: IWidgetParamConfig };
}

export interface IWidgetClass {
  id: number;
  storeId?: string; // ссылка на файл
  version?: string;
  name?: string;
  description?: string;
  web?: boolean;
  analytic?: boolean;
  mobile?: boolean;
}

export interface SocketEventData {
  refName: string;
  rowList: EventValue[];
}

export interface SocketSingleData extends SingleValue {
  refName: string;
}

export interface SocketIntervalData extends IntervalValue {
  refName: string;
}

export type WidgetDataList = Array<SocketSingleData | SocketIntervalData | SocketEventData>;

export interface WidgetSocketData {
  dataList: WidgetDataList;
  exwidget: number;
}

export enum ControllerState {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
}

export interface ControllerPayload {
  controllerId: number;
  state: ControllerState;
}

export interface WidgetSocketDataCommand {
  command: string;
  widgetDataList: WidgetSocketData[];
  message?: string;
  error?: string;
  payload?: ControllerPayload | any;
}

export interface WidgetSocketAnalyticDataCommand {
  cdpData: WidgetSocketAnalyticDataParamCommand | null;
  ccpData: WidgetSocketAnalyticDataParamCommand | null;
}

export interface WidgetSocketAnalyticDataParamCommand {
  id: number;
  time: number;
  value: string;
  stateId: number;
  sysStateId: number;
}

export interface IWidgetFile {
  name: string;
  id: string;
  parent: string;
  content: any;
  url: string;
  error?: Error;
}

// Обертка для среды разработки
export const Component = (opts) => {
  return (component) => {
    return component;
  };
};

export interface ModalOptions {
  header: string;
  width?: string;
}
