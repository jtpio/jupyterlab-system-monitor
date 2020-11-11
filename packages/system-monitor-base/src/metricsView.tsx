import { ReactWidget } from '@jupyterlab/apputils';

import React, { useEffect, useState } from 'react';

import { MemoryViewComponent } from './memoryView';

import { ResourceUsage } from './model';

/**
 * A MetricsView component to display CPU usage.
 */
const MetricsViewComponent = ({
  model,
}: {
  model: ResourceUsage.Model;
}): JSX.Element => {
  const [kernels, setKernels] = useState([]);

  const update = (): void => {
    setKernels(model.kernels);
  };

  useEffect(() => {
    model.changed.connect(update);
    return (): void => {
      model.changed.disconnect(update);
    };
  }, [model]);

  return (
    <div className={'jp-SystemMonitorMetrics-panel'}>
      <h2>Kernel Metrics</h2>
      <ul className={'jp-RunningSessions-sectionList'}>
        {kernels.map((metric) => {
          return (
            <li
              key={metric.id}
              title={`id: ${metric.id}`}
              className={'jp-RunningSessions-item'}
            >
              <MemoryViewComponent model={model} label={'Kernel'} />
              <button
                className={'jp-RunningSessions-itemShutdown jp-mod-styled'}
                onClick={(): void => {
                  console.log('shut down kernel');
                }}
              >
                SHUT&nbsp;DOWN
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

/**
 * A namespace for MetricsView statics.
 */
export namespace MetricsView {
  /**
   * Create a new MetricsView React Widget.
   *
   * @param model The resource usage model.
   */
  export const createMetricsView = (
    model: ResourceUsage.Model
  ): ReactWidget => {
    return ReactWidget.create(<MetricsViewComponent model={model} />);
  };
}
