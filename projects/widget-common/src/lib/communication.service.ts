import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

export enum CommunicationCommand {
  'values' = 'values',
  'params' = 'params',
  'locale' = 'locale',
  'theme' = 'theme',
  'widget' = 'widget',
  'resize' = 'resize',
}

export interface CommunicationValue {
  command?: CommunicationCommand;

  [k: string]: any;
}

@Injectable()
export class CommunicationService {

  private messageSource: Record<number, Subject<CommunicationValue>> = {};
  message$/*: Record<number, Observable<CommunicationValue>>*/ = {};

  cache: Record<number, Partial<Record<CommunicationCommand, CommunicationValue>>> = {};

  create(id: number) {
    if (!this.messageSource[id]) {
      this.messageSource[id] = new Subject<CommunicationValue>();
      this.message$[id] = this.messageSource[id].asObservable() as any;
      this.cache[id] = {};
    }
  }

  next(widgetId: number, value: CommunicationValue) {
    this.create(widgetId);
    this.messageSource[widgetId].next(value);
    if (value.command) {
      this.cache[widgetId][value.command] = value;
    }
  }

  subscribe(widgetId: number, callback: (data: CommunicationValue) => {}) {
    this.create(widgetId);
    if (this.cache[widgetId][CommunicationCommand.params]) {
      callback((this.cache[widgetId][CommunicationCommand.params]));
    }
    for (const k in this.cache[widgetId]) {
      if (this.cache[widgetId].hasOwnProperty(k)) {
        callback((this.cache[widgetId][k]));
      }
    }
    return this.message$[widgetId].subscribe(callback);
  }
}
