import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import { MainAreaWidget } from '@jupyterlab/apputils';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { buildIcon } from '@jupyterlab/ui-components';

import { JSONObject } from '@lumino/coreutils';

import { ITopBar } from 'jupyterlab-topbar';

import {
  MemoryView,
  ResourceUsage,
  CpuView,
  MetricsView,
  IResourceUsage,
} from 'jupyterlab-system-monitor-base';

import 'jupyterlab-system-monitor-base/style/index.css';

import '../style/index.css';

/**
 * The default refresh rate.
 */
const DEFAULT_REFRESH_RATE = 5000;

/**
 * The default memory label.
 */
const DEFAULT_MEMORY_LABEL = 'Mem: ';

/**
 * The default CPU label.
 */
const DEFAULT_CPU_LABEL = 'CPU: ';

/**
 * An interface for resource settings.
 */
interface IResourceSettings extends JSONObject {
  label: string;
}

/**
 * The command ids used by the system-monitor extension.
 */
export namespace CommandIDs {
  /**
   * Open the panel with detailed metrics
   */
  export const openPanel = 'system-monitor:open-panel';
}

/**
 * Initialization data for the system-monitor main plugin.
 */
const main: JupyterFrontEndPlugin<IResourceUsage> = {
  id: 'jupyterlab-system-monitor:plugin',
  autoStart: true,
  optional: [ISettingRegistry],
  provides: IResourceUsage,
  activate: async (app: JupyterFrontEnd, settingRegistry: ISettingRegistry) => {
    let refreshRate = DEFAULT_REFRESH_RATE;

    if (settingRegistry) {
      const settings = await settingRegistry.load(main.id);
      refreshRate = settings.get('refreshRate').composite as number;
    }

    const model = new ResourceUsage.Model({ refreshRate });
    await model.refresh();
    return {
      model,
    };
  },
};

/**
 * Initialization data for the system-monitor topbar plugin.
 */
const topbar: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-system-monitor:topbar',
  autoStart: true,
  requires: [IResourceUsage, ITopBar],
  optional: [ISettingRegistry],
  activate: async (
    app: JupyterFrontEnd,
    resourceUsage: IResourceUsage,
    topBar: ITopBar,
    settingRegistry: ISettingRegistry | null
  ) => {
    let cpuLabel = DEFAULT_CPU_LABEL;
    let memoryLabel = DEFAULT_MEMORY_LABEL;

    if (settingRegistry) {
      const settings = await settingRegistry.load(topbar.id);
      const cpuSettings = settings.get('cpu').composite as IResourceSettings;
      cpuLabel = cpuSettings.label;
      const memorySettings =
        settings.get('memory').composite as IResourceSettings;
      memoryLabel = memorySettings.label;
    }

    const { model } = resourceUsage;
    // add to the top bar
    if (model.cpuAvailable) {
      const cpu = CpuView.createCpuView(model, cpuLabel);
      topBar.addItem('cpu', cpu);
    }
    const memory = MemoryView.createMemoryView(model, memoryLabel);
    topBar.addItem('memory', memory);
  },
};

/**
 * Initialization data for the system-monitor panel plugin.
 */
const panel: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-system-monitor:panel',
  autoStart: true,
  requires: [IResourceUsage],
  activate: async (app: JupyterFrontEnd, resourceUsage: IResourceUsage) => {
    const { model } = resourceUsage;

    // add commands to open the panel
    const { commands, contextMenu } = app;
    commands.addCommand(CommandIDs.openPanel, {
      label: 'Show Metrics',
      execute: (args) => {
        const view = MetricsView.createMetricsView(model);
        const widget = new MainAreaWidget({ content: view });
        widget.title.label = 'Metrics';
        widget.title.icon = buildIcon;
        app.shell.add(widget, 'main', { mode: 'split-right' });
      },
    });

    contextMenu.addItem({
      command: CommandIDs.openPanel,
      selector: '.jp-IndicatorContainer',
    });
  },
};

/**
 * Export the plugins as default.
 */
const plugins: JupyterFrontEndPlugin<any>[] = [main, topbar, panel];

export default plugins;
