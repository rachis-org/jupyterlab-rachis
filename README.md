# jupyterlab-rachis

[![Github Actions Status](https://github.com/rachis-org/jupyterlab-rachis/workflows/Build/badge.svg)](https://github.com/rachis-org/jupyterlab-rachis/actions/workflows/build.yml)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/rachis-org/jupyterlab-rachis/main?urlpath=lab)

A JupyterLab MIME Renderer for Rachis Results

## Requirements

- JupyterLab >= 4.0.0, < 5

## Install

To install the extension, execute:

```bash
pip install jupyterlab-rachis
```

## Uninstall

To remove the extension, execute:

```bash
pip uninstall jupyterlab-rachis
```

## Clearing embedded visualizations

Inline visualizations can make the `.ipynb` files quite large. Sometimes, this is
a disadvantage, such as in assignment uploads to a course platform or sharing
notebooks over email.

With a notebook active, choose **Edit → Clear Rachis Visualizations** to remove
embedded Rachis archives from every code cell. Outputs keep their text
representation (such as `<visualization ...>`) and any other MIME representations.
Other outputs and execution counts are preserved.

Save the notebook again to reduce its file size.
Re-run a visualization's cell to embed and display it again.

## Contributing

### Development install

Use Node.js 22.12 or newer to build the extension.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) provided by `jupyter-builder`. Use `jlpm` for both
the root project and `ui-tests`, and commit the corresponding `yarn.lock`
after changing dependencies.

Builds target JupyterLab 4.0's metadata to preserve compatibility with JupyterLab
4.0 through 4.6. CI checks the same wheel on both versions; browser tests use
JupyterLab 4.6.4 and matching Galata dependencies.

```bash
# Clone the repo to your local environment
# Change directory to the jupyterlab-rachis directory

# Set up a virtual environment and install package in development mode
python -m venv .venv
source .venv/bin/activate
pip install "jupyter-builder>=1.2.0,<2" "jupyterlab==4.6.4"
pip install --editable "."

# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite

# Rebuild extension Typescript source after making changes
# IMPORTANT: Unlike the steps above which are performed only once, do this step
# every time you make a change.
jlpm build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Development uninstall

```bash
pip uninstall jupyterlab-rachis
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `jupyterlab-rachis` within that folder.

### Testing the extension

#### Frontend tests

This extension is using [Jest](https://jestjs.io/) for JavaScript code testing.

To execute them, execute:

```sh
jlpm
jlpm test
```

#### Integration tests

This extension uses [Playwright](https://playwright.dev/docs/intro) for the integration tests (aka user level tests).
More precisely, the JupyterLab helper [Galata](https://github.com/jupyterlab/jupyterlab/tree/master/galata) is used to handle testing the extension in JupyterLab.

More information are provided within the [ui-tests](./ui-tests/README.md) README.

### Packaging the extension

See [RELEASE](RELEASE.md)
