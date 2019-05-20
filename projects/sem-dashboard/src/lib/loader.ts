import {from, Observable} from 'rxjs';
import {WidgetPackage} from './widget.component';
import {IWidgetClass} from './widget.interface';


const WIDGET_CACHE: {
  [k: string]: Observable<WidgetPackage>
} = {};


export function getWidgetPath(widget: IWidgetClass): string {
  return `/assets/widgets/${widget.storeid}/`;
}

export function updateWidgetMediaUrl(media: object, url: string) {
  const res = {};
  for (const key in media) {
    if (media.hasOwnProperty(key)) {
      res[key] = url + media[key];
    }
  }
  return res;
}
