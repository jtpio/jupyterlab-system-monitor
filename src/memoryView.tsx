import React from "react";

import { Sparklines, SparklinesLine, SparklinesSpots } from "react-sparklines";

import { VDomRenderer } from "@jupyterlab/apputils";

import { MemoryUsage } from "@jupyterlab/statusbar";

const N_BUFFER = 20;

interface IMemoryBarProps {
  data: number[];
  percentage: number;
  text: string;
}

interface IMemoryBarState {
  isSparklines: boolean;
}

const MemoryFiller = (props: any) => {
  return (
    <div
      className="jp-MemoryFiller"
      style={{
        width: `${props.percentage * 100}%`,
        background: `${props.color}`
      }}
    />
  );
};

class MemoryBar extends React.Component<IMemoryBarProps, IMemoryBarState> {
  constructor(props: any) {
    super(props);
    this.state = {
      isSparklines: false
    };
  }

  toggleSparklines = () => {
    this.setState({
      isSparklines: !this.state.isSparklines
    });
  }

  render() {
    let color = this.props.percentage > 0.5
            ? this.props.percentage > 0.8
              ? "red"
              : "orange"
            : "green"

    let component;

    if (this.state.isSparklines) {
      component = (
        <Sparklines data={this.props.data} min={0.0} max={1.0} limit={N_BUFFER}>
          <SparklinesLine
            style={{
              stroke: color,
              strokeWidth: 3,
              fill: color,
              fillOpacity: 0.6
            }}
          />
          <SparklinesSpots />
        </Sparklines>
      );
    } else {
      component = <MemoryFiller percentage={this.props.percentage} color={color} />;
    }

    return (
      <div
        className="jp-MemoryBar"
        onClick={() => this.toggleSparklines()}
      >
        {component}
      </div>
    );
  }
}

export class MemoryView extends VDomRenderer<MemoryUsage.Model> {
  constructor(refreshRate: number = 5000) {
    super();
    this.model = new MemoryUsage.Model({ refreshRate });
    this.values = new Array(N_BUFFER).fill(0);
    this._intervalId = setInterval(
      () => this.model.stateChanged.emit(void 0),
      refreshRate
    );
  }

  dispose() {
    clearInterval(this._intervalId);
    super.dispose();
  }

  render() {
    if (!this.model) {
      return null;
    }
    const { memoryLimit, currentMemory, units } = this.model;
    const precision = ["B", "KB", "MB"].indexOf(units) > 0 ? 0 : 2;
    const text = `${currentMemory.toFixed(precision)} ${
      memoryLimit ? "/ " + memoryLimit.toFixed(precision) : ""
    } ${units}`;
    let percentage = memoryLimit
      ? Math.min(currentMemory / memoryLimit, 1)
      : null;
    this.values.push(percentage);
    this.values.shift();
    return (
      <div
        className="jp-MemoryContainer"
        style={percentage && { width: "200px" }}
      >
        <div className="jp-MemoryText">Mem: </div>
        <div className="jp-MemoryWrapper">
          {percentage && (
            <MemoryBar
              data={this.values}
              percentage={percentage}
              text={text}
            />
          )}
        </div>
        <div className="jp-MemoryText">{text}</div>
      </div>
    );
  }

  private values: number[];
  private _intervalId: any;
}
