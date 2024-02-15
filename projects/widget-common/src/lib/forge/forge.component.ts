/**
 *
 * Интеграций с Forge Autodesk
 */
/// <reference types="forge-viewer" />
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef, EventEmitter,
  Input,
  NgModule,
  NgZone,
  OnDestroy,
  OnInit, Output,
  ViewChild
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ParamAssignExtension, ParamLabel} from './ParamAssign';

import {HttpClient} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {ScriptService} from './Script.service';
import {ForgeOption} from './forge.interface';
import {Cookie} from 'ng2-cookies/ng2-cookies';

declare const Autodesk: any;


@Component({
  selector: 'app-forge',
  templateUrl: './forge.component.html',
  styleUrls: ['./forge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgeComponent implements OnInit, OnDestroy {

  constructor(private http: HttpClient,
              private cdr: ChangeDetectorRef,
              private ngZone: NgZone,
              private scripts: ScriptService) {

  }

  @ViewChild('forgeViewer') viewerDiv: ElementRef<HTMLDivElement>;

  @Input() urn = '';

  @Input() labels: ForgeOption[] = [];

  @Output() onReady = new EventEmitter();

  public documentId: string;

  viewer: any;


  @NgModule({
    declarations: [ForgeComponent],
    imports: [FormsModule, CommonModule],
    exports: [ForgeComponent],
    providers: [ScriptService],
    entryComponents: [ForgeComponent]
  })
  export;
  class;

  public ngOnInit() {
    this.scripts.load('viewer').then(data => {
      this.launchViewer(this.urn);
    }).catch(error => console.log(error));
    this.scripts.loadStyles();
  }

  ngOnDestroy() {

  }

  authForge(callback) {
    callback(Cookie.get('forge'), 3599);
  }

  launchViewer(urn) {
    const options = {
      env: 'AutodeskProduction',
      getAccessToken: this.authForge.bind(this)
    };
    this.ngZone.runOutsideAngular(() => {
      ParamAssignExtension.registerExtension(ParamAssignExtension.extensionName, this.extensionLoaded.bind(this));
      Autodesk.Viewing.Initializer(options, () => {
        const documentId = 'urn:' + urn;
        this.viewer = new Autodesk.Viewing.GuiViewer3D(this.viewerDiv.nativeElement,
          {extensions: []});
        Autodesk.Viewing.Document.load(documentId, this.onDocumentLoadSuccess.bind(this), this.onDocumentLoadFailure.bind(this));
      });
    });
  }

  extensionLoaded() {
    console.log('extensionLoaded');
  }


  afterViewerEvents(viewer, events) {
    const promises = [];
    events.forEach((event) => {
      promises.push(new Promise((resolve, reject) => {
        const handler = () => {
          viewer.removeEventListener(event, handler);
          resolve(null);
        };
        viewer.addEventListener(event, handler);
      }));
    });
    return Promise.all(promises);
  }


  onDocumentLoadSuccess(doc) {
    this.viewer.start();
    const viewables = doc.getRoot().getDefaultGeometry();
    this.viewer.loadDocumentNode(doc, viewables, {}).then(async (model) => {

      // await this.afterViewerEvents(
      //   this.viewer,
      //   [
      //     Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
      //     Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT
      //   ]
      // );
      this.loadParamExtension();
    });
  }

  loadParamExtension() {
    this.viewer.getObjectTree((tree) => {
      const icons: ParamLabel[] = [];
      tree.enumNodeChildren(tree.getRootId(), (dbid) => {
        this.labels.forEach(label => {
          if (label.name === tree.getNodeName(dbid)) {
            icons.push({
              element: label.element,
              dbId: dbid,
              name: label.name,
            });
          }
        });
      }, true);

      this.viewer.loadExtension(ParamAssignExtension.extensionName, {
        icons,
        // onClick: (id) => {
        //   switch (id) {
        //     case 2850:
        //       alert('Sensor offline');
        //   }
        // }
      });

      this.onReady.emit({viewer: this.viewer});

    });
  }

  onDocumentLoadFailure(viewerErrorCode, viewerErrorMsg) {
    console.error('onDocumentLoadFailure() - errorCode:' + viewerErrorCode + '\n- errorMessage:' + viewerErrorMsg);
  }

}


@NgModule({
  declarations: [ForgeComponent],
  imports: [FormsModule, CommonModule],
  exports: [ForgeComponent],
  providers: [ScriptService],
  entryComponents: [ForgeComponent]
})
export class ForgeComponentModule {
}




