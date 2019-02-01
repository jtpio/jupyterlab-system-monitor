import {
  JupyterLab, JupyterLabPlugin
} from '@jupyterlab/application';

import {
  ITopBar
} from 'jupyterlab-topbar';

import {
  MemoryView
} from './memoryView';

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
    let memory = new MemoryView();
    topBar.addItem('memory', memory);
  }
};

export default extension;
