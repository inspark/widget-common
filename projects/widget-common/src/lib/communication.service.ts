import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, Subscription } from 'rxjs';

export enum CommunicationCommand {
  values = 'values',
  params = 'params',
  locale = 'locale',
  theme = 'theme',
  widget = 'widget',
  resize = 'resize',
  paramData = 'paramData',
}

export interface CommunicationValue {
  command?: CommunicationCommand;
  [k: string]: any;
}

type Bus = {
  stream$: ReplaySubject<CommunicationValue>;      // общий поток по виджету с 1-элементным буфером
  lastByCmd: Partial<Record<CommunicationCommand, CommunicationValue>>; // опциональный кэш по командам
  subs: Set<Subscription>;
};

@Injectable()
export class CommunicationService {
  private buses: Record<string, Bus> = {};

  private ensure(id: string) {
    if (!this.buses[id]) {
      this.buses[id] = {
        stream$: new ReplaySubject<CommunicationValue>(1),
        lastByCmd: {},
        subs: new Set(),
      };
    }
  }

  create(id: number | string) {
    this.ensure(String(id).trim());
  }

  /**
   * Отправить сообщение в шину виджета.
   * Новые подписчики гарантированно получат последнее отправленное значение.
   */
  next(widgetId: number | string, value: CommunicationValue) {
    const _id = String(widgetId).trim();
    this.ensure(_id);
    if (value?.command) this.buses[_id].lastByCmd[value.command] = value;
    this.buses[_id].stream$.next(value);
  }

  /**
   * Подписка на все события виджета.
   */
  subscribe(
    widgetId: number | string,
    callback: (data: CommunicationValue) => void,
    { replayPerCommand = false }: { replayPerCommand?: boolean } = {}
  ) {
    const _id = String(widgetId).trim();
    this.ensure(_id);

    if (replayPerCommand) {
      const cache = this.buses[_id].lastByCmd;
      for (const k in cache) if (Object.prototype.hasOwnProperty.call(cache, k)) {
        const v = cache[k as CommunicationCommand];
        if (v) callback(v);
      }
    }

    const sub = this.buses[_id].stream$.subscribe(callback);
    this.buses[_id].subs.add(sub);
    return sub;
  }

  get$(widgetId: number | string): Observable<CommunicationValue> {
    const _id = String(widgetId).trim();
    this.ensure(_id);
    return this.buses[_id].stream$.asObservable();
  }

  /**
   * Очистить шину виджета и освободить ресурсы.
   */
  destroy(widgetId: number | string) {
    const _id = String(widgetId).trim();
    const bus = this.buses[_id];
    if (!bus) return;
    bus.subs.forEach(s => s.unsubscribe());
    bus.stream$.complete();
    delete this.buses[_id];
  }
}
