import {ItemSingle, WidgetItem} from './widget.interface';
import {ChangeDetectorRef} from '@angular/core';


export interface WidgetApi {
  cdRef: ChangeDetectorRef;

  paramCancel(par: WidgetItem): void;

  setManual(param: WidgetItem, value: boolean): void;

  paramEdit(param: WidgetItem, container?: HTMLElement): void;

  query<T = any, TOptions = any>(command: string, options?: TOptions): Promise<T>;

  mutation<T = any, TOptions = any>(command: string, options?: TOptions): Promise<T>;

  command<T = any, TOptions = any>(command: string, options?: TOptions): Promise<T>;

}

