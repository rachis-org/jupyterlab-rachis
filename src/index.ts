import { IRenderMime } from '@jupyterlab/rendermime-interfaces';

import { Widget } from '@lumino/widgets';

/**
 * The default mime type for the extension.
 */
const MIME_TYPE = 'application/vnd.rachis.archive+zip';

/**
 * The class name added to the extension.
 */
const CLASS_NAME = 'mimerenderer-Rachis Result (.qza/.qzv)';

/**
 * A widget for rendering Rachis Result (.qza/.qzv).
 */
export class OutputWidget extends Widget implements IRenderMime.IRenderer {
  /**
   * Construct a new output widget.
   */
  constructor(options: IRenderMime.IRendererOptions) {
    super();
    this._mimeType = options.mimeType;
    this.addClass(CLASS_NAME);
  }

  /**
   * Render Rachis Result (.qza/.qzv) into this widget's node.
   */
  renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    const data = model.data[this._mimeType] as string;
    this.node.textContent = data.slice(0, 16384);
    return Promise.resolve();
  }

  private _mimeType: string;
}

/**
 * A mime renderer factory for Rachis Result (.qza/.qzv) data.
 */
export const rendererFactory: IRenderMime.IRendererFactory = {
  safe: true,
  mimeTypes: [MIME_TYPE],
  createRenderer: options => new OutputWidget(options)
};

/**
 * Extension definition.
 */
const extension: IRenderMime.IExtension = {
  id: 'jupyterlab-rachis:plugin',
  // description: 'Adds MIME type renderer for Rachis Result (.qza/.qzv) content',
  rendererFactory,
  rank: 100,
  dataType: 'string',
  fileTypes: [
    {
      name: 'Rachis Result (.qza/.qzv)',
      mimeTypes: [MIME_TYPE],
      extensions: ['.qza,.qzv']
    }
  ],
  documentWidgetFactoryOptions: {
    name: 'Rachis Results Viewer (.qza/.qvz)',
    primaryFileType: 'Rachis Result (.qza/.qzv)',
    fileTypes: ['Rachis Result (.qza/.qzv)'],
    defaultFor: ['Rachis Result (.qza/.qzv)']
  }
};

export default extension;
