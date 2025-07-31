import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

export enum CommunicationCommand {
  'values' = 'values',
  'params' = 'params',
  'locale' = 'locale',
  'theme' = 'theme',
  'widget' = 'widget',
  'resize' = 'resize',
  'paramData' = 'paramData',
}

export interface CommunicationValue {
  command?: CommunicationCommand;

  [k: string]: any;
}

@Injectable()
export class CommunicationService {

  private messageSource: Record<string, Subject<CommunicationValue>> = {};
  message$/*: Record<number, Observable<CommunicationValue>>*/ = {};

  cache: Record<string, Partial<Record<CommunicationCommand, CommunicationValue>>> = {};

  create(id: number | string) {
    const _id = `${id}`.trim();
    if (!this.messageSource[_id]) {
      this.messageSource[_id] = new Subject<CommunicationValue>();
      this.message$[_id] = this.messageSource[_id].asObservable() as any;
      this.cache[_id] = {};
    }
  }

  next(widgetId: number | string, value: CommunicationValue) {
    const _id = `${widgetId}`.trim();
    this.create(_id);
    this.messageSource[_id].next(value);
    if (value.command) {
      this.cache[_id][value.command] = value;
    }
  }

  subscribe(widgetId: number | string, callback: (data: CommunicationValue) => {}) {
    const _id = `${widgetId}`.trim();
    this.create(_id);
    if (this.cache[_id][CommunicationCommand.params]) {
      callback((this.cache[_id][CommunicationCommand.params]));
    }
    for (const k in this.cache[_id]) {
      if (this.cache[_id].hasOwnProperty(k)) {
        callback((this.cache[_id][k]));
      }
    }
    return this.message$[_id].subscribe(callback);
  }
}
