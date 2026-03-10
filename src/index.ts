import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { MimeDocumentFactory } from '@jupyterlab/docregistry';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ITranslator } from '@jupyterlab/translation';
import { Widget } from '@lumino/widgets';

/**
 * The default mime type for the extension.
 */
const MIME_TYPE = 'application/vnd.rachis.archive+zip';
const PLUGIN_ID = 'jupyterlab-rachis:plugin';
const FILE_TYPE_NAME = 'rachis-archive';
const DOCUMENT_FACTORY_NAME = 'Rachis Results Viewer (.qvz)';
const IFRAME_ORIGIN_SETTING = 'iframeOrigin';
const IFRAME_PATH_SETTING = 'iframePath';

const iframeConfig = {
  origin: '',
  path: ''
};

/**
 * The class name added to the extension.
 */
const CLASS_NAME = 'mimerenderer-rachis-archive';

function configureIframe(origin: string, path: string): void {
  const parsed = new URL(origin.trim());
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(
      `[jupyterlab-rachis] iframeOrigin must use http:// or https://, got '${origin}'.`
    );
  }
  const trimmed = path.trim();
  if (!trimmed.startsWith('/')) {
    throw new Error(
      `[jupyterlab-rachis] iframePath must begin with '/', got '${path}'.`
    );
  }
  iframeConfig.origin = parsed.origin;
  iframeConfig.path = trimmed;
}

function createMessageChannel(
  iframe: HTMLIFrameElement,
  host: string
): Promise<MessagePort> {
  /**
   * Perform a 4-way handshake to create a secure 1-sided channel, where only the
   * inner iframe needs an onMessage handler. 4-way handshake is needed because
   * the exact MessagePort depends on the queue state and multiple ports will be
   * transfered in arbitrary order (when multiple channels are being constructed
   * at once and we add the JS event loop). It doesn't matter which port is
   * ultimately used, but it does matter that both sides are using the same ones.
   * The final ready message indicates the inner page is ready to respond.
   *
   * | OUTER PAGE |   | INNER IFRAME |
   *  ------------     --------------
   *     SESSION_PROPOSE(w) ---> |
   *     SESSION_PROPOSE(x) ---> |
   *     SESSION_PROPOSE(y) ---> |
   *     |  <--- SESSION_ACCEPT(y)
   *     SESSION_PROPOSE(z) ---> |
   *     |  <--- SESSION_ACCEPT(z)
   *     SESSION_CONFIRM(y) ---> |
   *     |  <---  SESSION_READY(y)
   *     |                       |
   *     |  <--- channel(y) ---> |
   */
  const controller = new AbortController();
  const id = Math.random().toString(16).slice(2);
  return new Promise<MessagePort>((resolve, reject) => {
    iframe.addEventListener(
      'load',
      () => {
        let counter = 0;
        let connected = false;
        const handle = window.setInterval(() => {
          if (connected) {
            return;
          }

          const channel = new MessageChannel();
          const session = Math.random().toString(16).slice(2);
          channel.port1.addEventListener(
            'message',
            (msg: MessageEvent) => {
              connected = true;
              window.clearInterval(handle);

              if (msg.data.event === 'SESSION_ACCEPT') {
                channel.port1.postMessage({
                  event: 'SESSION_CONFIRM',
                  id,
                  session
                });
              } else if (msg.data.event === 'SESSION_READY') {
                console.debug(`[${id}: parent / ${session}] Connection ready.`);
                controller.abort();
                resolve(channel.port1);
              } else {
                reject(
                  `[${id}: parent] Connected to iframe, but ${host} did not accept.`
                );
              }
            },
            { signal: controller.signal }
          );

          channel.port1.start();

          counter++;
          if (counter > 200) {
            window.clearInterval(handle);
            controller.abort();
            reject(
              `[${id}: parent] Could not connect to iframe, ${host} did not respond.`
            );
          }
          console.debug(
            `[${id}: parent / ${session}] Attempting to reach ${host} in iframe.`
          );
          iframe.contentWindow?.postMessage(
            {
              event: 'SESSION_PROPOSE',
              port: channel.port2,
              id,
              session
            },
            host,
            [channel.port2]
          );
        }, 10);
      },
      { signal: controller.signal }
    );
  });
}

// TODO: replace with Uint8Array.fromBase64(string) when it is widely available
// originally from
// https://github.com/jupyterlab/jupyterlab/blob/a644ef962281e73326b8548a95c3f7d52dc8f4a7/packages/pdf-extension/src/index.ts#L167-L201
// // Copyright (c) Jupyter Development Team.
// // Distributed under the terms of the Modified BSD License.
/**
 * Convert a base64 encoded string to a Blob object.
 * Modified from a snippet found here:
 * https://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
 *
 * @param b64Data - The base64 encoded data.
 *
 * @param contentType - The mime type of the data.
 *
 * @param sliceSize - The size to chunk the data into for processing.
 *
 * @returns a Blob for the data.
 *
 */
function b64toBlob(
  b64Data: string,
  contentType: string = '',
  sliceSize: number = 512
): Blob {
  const byteCharacters = atob(b64Data);
  const byteArrays: Uint8Array<ArrayBuffer>[] = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
}

/**
 * A widget for rendering rachis-archive.
 */
export class OutputWidget extends Widget implements IRenderMime.IRenderer {
  private _outbound: Promise<MessagePort>;
  private _sent = false;

  /**
   * Construct a new output widget.
   */
  constructor() {
    super();
    this.addClass(CLASS_NAME);

    const host = iframeConfig.origin;
    const path = iframeConfig.path;
    const iframe = document.createElement('iframe');
    iframe.src = new URL(path, host).toString();
    iframe.style.border = '0';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.position = 'absolute';
    this.node.appendChild(iframe);

    this._outbound = createMessageChannel(iframe, host);
    this._outbound.then(port => {
      port.addEventListener('message', msg => {
        this.onInnerMessage(msg);
      });
    });
  }

  private onInnerMessage(msg: MessageEvent<any>) {
    const handlers = {
      inner_size: (msg: any) => {
        if (this.node.classList.contains('jp-OutputArea-output')) {
          this.node.style.height = `${msg.height + 50}px`;
        }
      }
    };
    handlers[msg.data.event as keyof typeof handlers](msg.data);
  }

  protected onResize(msg: Widget.ResizeMessage): void {
    this.node.style.minHeight = `${msg.height}px`;
  }

  private sendInnerMessage(
    message: any,
    transfers: Transferable[] | undefined = undefined
  ) {
    return this._outbound.then(port => {
      if (transfers) {
        port.postMessage(message, transfers);
      } else {
        port.postMessage(message);
      }
    });
  }

  /**
   * Render rachis-archive into this widget's node.
   */
  renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    if (this._sent) {
      return Promise.resolve();
    }

    const blob = b64toBlob(model.data[MIME_TYPE] as string);

    return this.sendInnerMessage({ event: 'BLOB_ARCHIVE', blob }).then(() => {
      this._sent = true;
      return Promise.resolve();
    });
  }
}

/**
 * A mime renderer factory for rachis-archive data.
 */
const rendererFactory: IRenderMime.IRendererFactory = {
  safe: true,
  mimeTypes: [MIME_TYPE],
  createRenderer: () => new OutputWidget()
};

/**
 * Extension definition.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: PLUGIN_ID,
  autoStart: true,
  requires: [IRenderMimeRegistry, ITranslator, ISettingRegistry],
  activate: async (
    app: JupyterFrontEnd,
    rendermime: IRenderMimeRegistry,
    translator: ITranslator,
    settingRegistry: ISettingRegistry
  ) => {
    const settings = await settingRegistry.load(PLUGIN_ID);
    configureIframe(
      settings.get(IFRAME_ORIGIN_SETTING).composite as string,
      settings.get(IFRAME_PATH_SETTING).composite as string
    );
    settings.changed.connect(updated => {
      configureIframe(
        updated.get(IFRAME_ORIGIN_SETTING).composite as string,
        updated.get(IFRAME_PATH_SETTING).composite as string
      );
    });

    rendermime.addFactory(rendererFactory, 100);

    if (!app.docRegistry.getFileType(FILE_TYPE_NAME)) {
      app.docRegistry.addFileType({
        name: FILE_TYPE_NAME,
        mimeTypes: [MIME_TYPE],
        extensions: ['.qzv'],
        fileFormat: 'base64' // important magic in JupyterLab
      });
    }

    if (app.docRegistry.getWidgetFactory(DOCUMENT_FACTORY_NAME)) {
      return;
    }

    const factory = new MimeDocumentFactory({
      dataType: 'string',
      rendermime,
      modelName: 'base64', // important magic in JupyterLab
      name: DOCUMENT_FACTORY_NAME,
      primaryFileType: app.docRegistry.getFileType(FILE_TYPE_NAME),
      fileTypes: [FILE_TYPE_NAME],
      defaultFor: [FILE_TYPE_NAME],
      translator,
      factory: rendererFactory
    });

    app.docRegistry.addWidgetFactory(factory);
  }
};

export default extension;
