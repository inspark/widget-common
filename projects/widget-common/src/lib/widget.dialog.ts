export class WidgetDialog {

  onClose;

  constructor(opts: { close: Function }) {
    this.onClose = opts.close;
  }

  close() {
    if (this.onClose) {
      this.onClose();
    }
  }
}
