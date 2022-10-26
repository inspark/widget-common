import {Extension} from './extenstion';


export interface ParamLabel {
  dbId: number;
  element: HTMLElement;
  name: string;
}

interface Label {
  label: HTMLLabelElement;
  id: number;
}

export class ParamAssignExtension extends Extension {

  constructor(viewer, options) {
    super(viewer, options);
    this._group = null;
    this._button = null;
    this._icons = options.icons || [];
    this.options = options;
  }

  public static extensionName = 'ParamAssignExtension';

  private static callback: (ext: ParamAssignExtension) => void = null;
  _group: any;
  _button: any;
  _icons: ParamLabel[];
  options: any;
  _enabled = false;

  _frags: any = {};

  labels: Label[] = [];

  container: HTMLDivElement | null = null;

  public static registerExtension(extensionName: string, callback: (ext: ParamAssignExtension) => void) {
    ParamAssignExtension.callback = callback;
    super.registerExtension(ParamAssignExtension.extensionName, ParamAssignExtension);
  }


  public activate() {
    return true;
  }

  public deactivate() {
    return true;
  }

  load() {
    this.container = (this.viewer as any).clientContainer;
    this._enabled = true;
    if (this.viewer.model && this.viewer.model.getInstanceTree()) {
      this.customize();
    } else {
      this.viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, this.customize.bind(this));
    }
    if (ParamAssignExtension.callback) {
      ParamAssignExtension.callback(this);
    }
    return true;
  }

  unload() {
    // Clean our UI elements if we added any
    if (this._group) {
      this._group.removeControl(this._button);
      if (this._group.getNumberOfControls() === 0) {
        this.viewer.toolbar.removeControl(this._group);
      }
    }
    return true;
  }

  customize() {
    this.showIcons();
    const updateIconsCallback = () => {
      this.updateIcons();
    };
    this.viewer.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, updateIconsCallback);
    this.viewer.addEventListener(Autodesk.Viewing.ISOLATE_EVENT, updateIconsCallback);
    this.viewer.addEventListener(Autodesk.Viewing.HIDE_EVENT, updateIconsCallback);
    this.viewer.addEventListener(Autodesk.Viewing.SHOW_EVENT, updateIconsCallback);
  }


  showIcons() {
    const $viewer: HTMLDivElement = this.container.querySelector('.adsk-viewing-viewer');
    const element = this.container.querySelector('label.markup');
    // remove previous...
    if (element) {
      element.remove();
    }

    this.labels = [];

    // do we have anything to show?
    if (this._icons === undefined || this._icons === null) {
      return;
    }

    // do we have access to the instance tree?
    const tree = this.viewer.model && this.viewer.model.getInstanceTree();
    if (tree === undefined) {
      return;
    }

    const onClick = (e) => {
      // this.viewer.select($(e.currentTarget).data('id'));
      // this.viewer.utilities.fitToView();
    };

    this._frags = {};
    for (let i = 0; i < this._icons.length; i++) {
      // we need to collect all the fragIds for a given dbId
      const icon = this._icons[i];
      this._frags['dbId' + icon.dbId] = [];


      const $label = document.createElement('label');
      $label.setAttribute('data-id', '' + icon.dbId);
      $label.className = 'markup update';
      $label.style.setProperty('display', this.viewer.isNodeVisible(icon.dbId) ? 'block' : 'none');
      $label.style.setProperty('position', 'absolute');
      $label.style.setProperty('white-space', 'nowrap');
      $label.style.setProperty('cursor', 'pointer');
      $label.style.setProperty('z-index', '1');
      $label.addEventListener('click', this.options.onClick || onClick);


      $label.appendChild(icon.element);
      $viewer.appendChild($label);


      // now collect the fragIds
      const getChildren = (topParentId, dbId) => {
        if (tree.getChildCount(dbId) === 0) {
          getFrags(topParentId, dbId);
        } // get frags for this leaf child
        tree.enumNodeChildren(dbId, (childId) => {
          getChildren(topParentId, childId);
        });
      };
      const getFrags = (topParentId, dbId) => {
        tree.enumNodeFragments(dbId, (fragId) => {
          this._frags['dbId' + topParentId].push(fragId);
        });
      };
      getChildren(icon.dbId, icon.dbId);
      this.labels.push({id: icon.dbId, label: $label});
    }
    this.updateIcons(); // re-position for each fragId found
  }

  getModifiedWorldBoundingBox(dbId) {
    const fragList = this.viewer.model.getFragmentList();
    const nodebBox = new THREE.Box3();

    // for each fragId on the list, get the bounding box
    for (const fragId of this._frags['dbId' + dbId]) {
      const fragbBox = new THREE.Box3();
      fragList.getWorldBounds(fragId, fragbBox);
      nodebBox.union(fragbBox); // create a unifed bounding box
    }

    return nodebBox;
  }

  updateIcons() {

    for (let i = 0; i < this.labels.length; i++) {
      const pos = this.viewer.worldToClient(this.getModifiedWorldBoundingBox(this.labels[i].id).getCenter());
      const label = this.labels[i].label;

      label.style.setProperty('left', Math.floor(pos.x - label.offsetWidth / 2) + 'px');
      label.style.setProperty('top', Math.floor(pos.y - label.offsetHeight / 2) + 'px');
      label.style.setProperty('display', this.viewer.isNodeVisible(this.labels[i].id) ? 'block' : 'none');

    }

  }
}

