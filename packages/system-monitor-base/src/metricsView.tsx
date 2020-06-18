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
    <>
      {kernels.map((metric) => (
        <MemoryViewComponent key={metric.id} model={model} label={metric.id} />
      ))}
    </>
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
