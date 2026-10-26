import { JupyterFrontEnd } from '@jupyterlab/application';
import type { ICodeCell } from '@jupyterlab/nbformat';
import { NotebookModel } from '@jupyterlab/notebook';
import { nullTranslator } from '@jupyterlab/translation';
import { CommandRegistry } from '@lumino/commands';
import { Signal } from '@lumino/signaling';
import extension from '../index';

const MIME_TYPE = 'application/vnd.rachis.archive+zip';
const COMMAND = 'jupyterlab-rachis:clear-visualizations';
const text = '<visualization: Example UUID: abc123>';

function createNotebook(): NotebookModel {
  const model = new NotebookModel();
  model.fromJSON({
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {},
    cells: [
      { cell_type: 'markdown', metadata: {}, source: '# Results' },
      {
        cell_type: 'code',
        metadata: {},
        source: 'visualization',
        execution_count: 7,
        outputs: [
          { output_type: 'stream', name: 'stdout', text: 'Progress\n' },
          {
            output_type: 'execute_result',
            execution_count: 7,
            data: { [MIME_TYPE]: 'A'.repeat(100000), 'text/plain': text },
            metadata: { [MIME_TYPE]: { expanded: true }, other: 'keep' }
          },
          {
            output_type: 'display_data',
            data: { 'image/png': 'image', 'text/plain': 'Other output' },
            metadata: {}
          }
        ]
      },
      {
        cell_type: 'code',
        metadata: {},
        source: 'display(visualization)',
        execution_count: 8,
        outputs: [
          {
            output_type: 'display_data',
            data: { [MIME_TYPE]: 'archive', 'text/plain': text },
            metadata: {}
          },
          {
            output_type: 'error',
            ename: 'ExampleError',
            evalue: 'example',
            traceback: ['example traceback']
          }
        ]
      }
    ]
  });
  model.dirty = false;
  return model;
}

describe('Clear Rachis Visualizations command', () => {
  let model: NotebookModel;
  let commands: CommandRegistry;
  let shell: { currentWidget: unknown; currentChanged: Signal<any, any> };

  beforeEach(async () => {
    model = createNotebook();
    commands = new CommandRegistry();
    const panel = { model };
    shell = { currentWidget: panel, currentChanged: new Signal({}) };
    const app = {
      commands,
      shell,
      docRegistry: {
        getFileType: () => ({}),
        getWidgetFactory: () => ({})
      }
    } as unknown as JupyterFrontEnd;
    await extension.activate(
      app,
      { addFactory: jest.fn() },
      nullTranslator,
      {
        load: async () => ({
          get: (key: string) => ({
            composite:
              key === 'iframeOrigin' ? 'https://example.com' : '/embed/'
          }),
          changed: new Signal({})
        })
      },
      { currentWidget: panel }
    );
  });

  afterEach(() => model.dispose());

  it('removes archives across the notebook while preserving other output data', async () => {
    const expected = model.toJSON();
    const originalSize = JSON.stringify(expected).length;
    (expected.cells[1] as ICodeCell).outputs[1] = {
      output_type: 'execute_result',
      execution_count: 7,
      data: { 'text/plain': text },
      metadata: { other: 'keep' }
    };
    (expected.cells[2] as ICodeCell).outputs[0] = {
      output_type: 'display_data',
      data: { 'text/plain': text },
      metadata: {}
    };

    expect(commands.isEnabled(COMMAND)).toBe(true);
    await commands.execute(COMMAND);

    expect(model.toJSON()).toEqual(expected);
    expect(model.dirty).toBe(true);
    expect(JSON.stringify(model.toJSON()).length).toBeLessThan(
      originalSize / 10
    );

    model.dirty = false;
    await commands.execute(COMMAND);
    expect(model.toJSON()).toEqual(expected);
    expect(model.dirty).toBe(false);
  });

  it('is disabled and leaves outputs intact when another document is active', async () => {
    const original = model.toJSON();
    shell.currentWidget = {};
    expect(commands.isEnabled(COMMAND)).toBe(false);
    await commands.execute(COMMAND);
    expect(model.toJSON()).toEqual(original);
  });

  it('is disabled for read-only notebooks', async () => {
    model.readOnly = true;
    const original = model.toJSON();
    expect(commands.isEnabled(COMMAND)).toBe(false);
    await commands.execute(COMMAND);
    expect(model.toJSON()).toEqual(original);
  });
});
