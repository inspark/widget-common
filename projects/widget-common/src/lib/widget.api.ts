import {ModalOptions, WidgetItem} from './widget.interface';
import {ChangeDetectorRef, TemplateRef} from '@angular/core';
import {WidgetDialog} from './widget.dialog';


export interface WidgetApi {
  cdRef: ChangeDetectorRef;

  paramCancel(par: WidgetItem): void;

  setManual(param: WidgetItem, value: boolean): void;

  paramEdit(param: WidgetItem, container?: HTMLElement): void;

  openModal(component: TemplateRef<any>, opts: ModalOptions): Promise<WidgetDialog>;

  query<T = any, TOptions = any>(command: string, options?: TOptions): Promise<T>;

  mutation<T = any, TOptions = any>(command: string, options?: TOptions): Promise<T>;

  command<T = any, TOptions = any>(command: string, options?: TOptions): Promise<T>;

}

