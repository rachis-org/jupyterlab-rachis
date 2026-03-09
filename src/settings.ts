import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import {
  IFRAME_ORIGIN_SETTING,
  IFRAME_PATH_SETTING,
  setIframeOrigin,
  setIframePath
} from './host';

const SETTINGS_PLUGIN_ID = 'jupyterlab-rachis:settings';

function updateIframeSettings(settings: ISettingRegistry.ISettings): void {
  setIframeOrigin(settings.get(IFRAME_ORIGIN_SETTING).composite);
  setIframePath(settings.get(IFRAME_PATH_SETTING).composite);
}

const settingsPlugin: JupyterFrontEndPlugin<void> = {
  id: SETTINGS_PLUGIN_ID,
  autoStart: true,
  requires: [ISettingRegistry],
  activate: async (
    _app: JupyterFrontEnd,
    settingRegistry: ISettingRegistry
  ) => {
    try {
      const settings = await settingRegistry.load(SETTINGS_PLUGIN_ID);
      updateIframeSettings(settings);
      settings.changed.connect(updated => {
        updateIframeSettings(updated);
      });
    } catch (error) {
      console.error('[jupyterlab-rachis] Failed to load settings.', error);
      setIframeOrigin(undefined);
      setIframePath(undefined);
    }
  }
};

export default settingsPlugin;
