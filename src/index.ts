import {
  JupyterLab, JupyterLabPlugin
} from '@jupyterlab/application';

import { Widget } from '@phosphor/widgets';

import {
  ITopBar
} from 'jupyterlab-topbar';

import '../style/index.css';


/**
 * Initialization data for the jupyterlab-system-monitor extension.
 */
const extension: JupyterLabPlugin<void> = {
  id: 'jupyterlab-system-monitor',
  autoStart: true,
  requires: [
    ITopBar,
  ],
  activate: (
    app: JupyterLab,
    topBar: ITopBar
  ) => {
    let widget = new Widget();
    topBar.addItem(widget);

    console.log('JupyterLab extension jupyterlab-system-monitor is activated!');
  }
};

export default extension;
