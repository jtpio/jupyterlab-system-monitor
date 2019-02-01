import React from 'react';

import { VDomRenderer } from '@jupyterlab/apputils';

import { MemoryUsage } from './memoryUsage';

const MemoryFiller = (props: any) => {
    return (
        <div className="jp-MemoryFiller" style={{
            width: `${props.percentage}%`,
            background: props.percentage > 50 ? ((props.percentage > 80) ? 'red' : 'orange') : 'green'
        }}></div>
    )
}

const MemoryBar = (props: any) => {
    return (
        <div className="jp-MemoryBar">
            <MemoryFiller percentage={props.percentage} />
        </div>
    )
}

export class MemoryView extends VDomRenderer<MemoryUsage.Model> {
  constructor(refreshRate: number = 5000) {
    super();
    this.model = new MemoryUsage.Model({ refreshRate });
  }

  render() {
    if (!this.model) {
      return null;
    }
    const { memoryLimit, currentMemory, units } = this.model;
    const text = `${currentMemory.toFixed(0)} ${memoryLimit ? memoryLimit.toFixed(0) : ''} ${units}`;
    let percentage = memoryLimit ? currentMemory / memoryLimit : null;
    return (
        <div className="jp-MemoryContainer" style={percentage && { width: '200px' }}>
            <div className="jp-MemoryText">Mem: </div>
            <div className="jp-MemoryWrapper">
                {percentage && <MemoryBar percentage={percentage} text={text} />}
            </div>
            <div className="jp-MemoryText">{text}</div>
        </div>
    );
  }
}