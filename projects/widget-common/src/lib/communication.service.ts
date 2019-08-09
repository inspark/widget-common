import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

@Injectable()
export class CommunicationService {


  private messageSource = {};
  message$ = {};

  create(id: number) {
    if (!this.messageSource[id]) {
      this.messageSource[id] = new Subject();
      this.message$[id] = this.messageSource[id].asObservable();
    }
  }

  next(widgetId: number, value: any) {
    this.create(widgetId);
    this.messageSource[widgetId].next(value);
  }
}
