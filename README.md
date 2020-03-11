# JupyterLab System Monitor

[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/jtpio/jupyterlab-system-monitor/stable?urlpath=lab)

JupyterLab extension to display system information (memory and cpu usage).

Provides an alternative frontend for the `nbresuse` metrics: [https://github.com/yuvipanda/nbresuse](https://github.com/yuvipanda/nbresuse)

![screencast](./doc/screencast.gif)

This extension was originally developed as part of the [jupyterlab-topbar](https://github.com/jtpio/jupyterlab-topbar) project, and extracted into its own repository later on.

## TODO

- Add CPU usage
- Add Network I/O
- Expose more settings

## Prerequisites

- JupyterLab 1.0+

## Installation

This extension requires the `nbresuse` package and the `jupyterlab-topbar-extension` extension for JupyterLab.

```bash
pip install nbresuse
jupyter labextension install jupyterlab-topbar-extension jupyterlab-system-monitor
```

## Configuration

### Graphic Display

You can set the memory limit (but not enforce it) to display the indicator in the top bar.

For more info, check the [memory limit](https://github.com/yuvipanda/nbresuse#memory-limit) in the [nbresuse](https://github.com/yuvipanda/nbresuse) repository.

Edit `~/.jupyter/jupyter_notebook_config.py`:

``` python
c = get_config()

c.NotebookApp.ResourceUseDisplay.mem_limit = Size_of_GB *1024*1024*1024
```

Or use the command line option:

```bash
# POSIX shell
jupyter lab --NotebookApp.ResourceUseDisplay.mem_limit=$(( Size_of_GB *1024*1024*1024))
```

### Advanced Settings

You can change the label and refresh rate in JupyterLab's advanced settings editor:

![jupyterlab_setting](./doc/setting.png)

## Development

```bash
# create a new conda environment
conda create -n jupyterlab-system-monitor jupyterlab nodejs
conda activate jupyterlab-system-monitor

# package to retrieve the system metrics
python -m pip install nbresuse

# required to place indicators in the top area
jupyter labextension install jupyterlab-topbar-extension

# local install of the extension
jupyter labextension link system-monitor-base
jupyter labextension install system-monitor
```
