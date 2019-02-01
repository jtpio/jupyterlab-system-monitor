import {
  JupyterLab, JupyterLabPlugin
} from '@jupyterlab/application';

import {
  ITopBar
} from 'jupyterlab-topbar';

import {
  MemoryUsage
} from './memoryUsage';

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
    let memoryUsage = new MemoryUsage();
    topBar.addItem('example', memoryUsage);

    console.log('JupyterLab extension jupyterlab-system-monitor is activated!');
  }
};

export default extension;
