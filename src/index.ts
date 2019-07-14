import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from "@jupyterlab/application";

import { ISettingRegistry } from "@jupyterlab/coreutils";

import { ITopBar } from "jupyterlab-topbar";

import { MemoryView } from "./memoryView";

import "../style/index.css";

/**
 * Initialization data for the jupyterlab-system-monitor extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: "jupyterlab-system-monitor:plugin",
  autoStart: true,
  requires: [ITopBar],
  optional: [ISettingRegistry],
  activate: async (
    app: JupyterFrontEnd,
    topBar: ITopBar,
    settingRegistry: ISettingRegistry
  ) => {
    let refreshRate;
    if (settingRegistry) {
      const settings = await settingRegistry.load(extension.id);
      refreshRate = settings.get("refreshRate").composite as number;
    }
    let memory = new MemoryView(refreshRate);
    topBar.addItem("memory", memory);
  }
};

export default extension;
