import {Observable} from 'rxjs';
import {WidgetPackage} from './widget.component';


const WIDGET_CACHE: {
  [k: string]: Observable<WidgetPackage>
} = {};



export function updateWidgetMediaUrl(media: object, url: string) {
  const res = {};
  for (const key in media) {
    if (media.hasOwnProperty(key)) {
      res[key] = url + media[key];
    }
  }
  return res;
}
