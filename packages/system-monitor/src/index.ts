import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import {
  MainAreaWidget,
  Dialog,
  showDialog,
  ReactWidget,
} from '@jupyterlab/apputils';

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
 * The default memory warning threshold.
 */
const DEFAULT_MEM_WARNING_THRESHOLD = 0.5;

/**
 * An interface for resource settings.
 */
interface IResourceSettings extends JSONObject {
  label: string;
  warn?: number;
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
      const settings = await settingRegistry.load(main.id);
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
  optional: [ISettingRegistry],
  activate: async (
    app: JupyterFrontEnd,
    resourceUsage: IResourceUsage,
    settingRegistry: ISettingRegistry | null
  ) => {
    const { model } = resourceUsage;

    let widget: MainAreaWidget<ReactWidget>;

    // add commands to open the panel
    const { commands, contextMenu } = app;
    commands.addCommand(CommandIDs.openPanel, {
      label: 'Show Metrics',
      execute: (args) => {
        if (!widget || widget.isDisposed) {
          const view = MetricsView.createMetricsView(model);
          widget = new MainAreaWidget({ content: view });
          widget.id = 'jp-system-monitor-metrics';
          widget.title.label = 'Metrics';
          widget.title.icon = buildIcon;
          widget.title.closable = true;
          app.shell.add(widget, 'main', { mode: 'split-right' });
        }
        app.shell.activateById(widget.id);
      },
    });

    contextMenu.addItem({
      command: CommandIDs.openPanel,
      selector: '.jp-IndicatorContainer',
    });

    let memoryWarning = DEFAULT_MEM_WARNING_THRESHOLD;

    if (settingRegistry) {
      const settings = await settingRegistry.load(main.id);
      const memory = settings.get('memory').composite as IResourceSettings;
      memoryWarning = memory.warn;
    }

    let displayed = false;
    const showWarning = async (): Promise<void> => {
      const { values } = model;
      const last = values.slice(values.length - 5);
      const show = last.every((value) => value.memoryPercent >= memoryWarning);

      // Do not show the dialog if:
      // - no high memory usage
      // - the dialog is already displayed
      // - the metrics main area widget is already attached
      if (!show || displayed || (widget && widget.isAttached)) {
        return;
      }

      displayed = true;
      const body = 'High memory usage';
      const result = await showDialog({
        title: 'High Memory Usage',
        body,
        buttons: [
          Dialog.cancelButton({ label: 'Hide Warning' }),
          Dialog.okButton({ label: 'Show Metrics' }),
        ],
      });
      if (result.button.accept) {
        commands.execute(CommandIDs.openPanel);
      } else {
        // set warning above 1 to disable the dialog
        memoryWarning = 2;
      }

      displayed = false;
    };

    model.changed.connect(showWarning);
  },
};

/**
 * Export the plugins as default.
 */
const plugins: JupyterFrontEndPlugin<any>[] = [main, topbar, panel];

export default plugins;
