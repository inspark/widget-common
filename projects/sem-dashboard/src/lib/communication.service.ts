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

  next(id: number, val: any) {
    this.create(id);
    this.messageSource[id].next(val);
  }
}