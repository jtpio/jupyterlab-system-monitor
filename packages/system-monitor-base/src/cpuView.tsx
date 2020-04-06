import { ReactWidget } from '@jupyterlab/apputils';

import React, { useEffect, useState, ReactElement } from 'react';

import { IndicatorComponent } from './indicator';

import { ResourceUsage } from './model';

/**
 * A CpuView component to display CPU usage.
 */
const CpuViewComponent = ({
  model,
  label,
}: {
  model: ResourceUsage.Model;
  label: string;
}): ReactElement => {
  const [text, setText] = useState('');
  const [values, setValues] = useState([]);

  const update = (): void => {
    const { currentCpuPercent } = model;
    const newValues = model.values.map((value) => value.cpuPercent);
    const newText = `${(currentCpuPercent * 100).toFixed(0)}%`;
    setText(newText);
    setValues(newValues);
  };

  useEffect(() => {
    model.changed.connect(update);
    return (): void => {
      model.changed.disconnect(update);
    };
  }, [model]);

  return (
    <IndicatorComponent
      enabled={model.cpuAvailable}
      values={values}
      label={label}
      color={'#0072B3'}
      text={text}
    />
  );
};

/**
 * A namespace for CpuView statics.
 */
export namespace CpuView {
  /**
   * Create a new CpuView React Widget.
   *
   * @param model The resource usage model.
   * @param label The label next to the component.
   */
  export const createCpuView = (
    model: ResourceUsage.Model,
    label: string
  ): ReactWidget => {
    return ReactWidget.create(<CpuViewComponent model={model} label={label} />);
  };
}
