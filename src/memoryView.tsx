import React from "react";

import { Sparklines, SparklinesLine, SparklinesSpots } from "react-sparklines";

import { VDomRenderer } from "@jupyterlab/apputils";

import { MemoryUsage } from "@jupyterlab/statusbar";

const N_BUFFER = 20;

interface IMemoryBarProps {
  data: number[];
  percentage: number;
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
  };

  render() {
    const color =
      this.props.percentage > 0.5
        ? this.props.percentage > 0.8
          ? "red"
          : "orange"
        : "green";

    let component;

    if (this.state.isSparklines) {
      component = (
        <Sparklines
          data={this.props.data}
          min={0.0}
          max={1.0}
          limit={N_BUFFER}
          width={250}
          margin={0}
        >
          <SparklinesLine
            style={{
              stroke: color,
              strokeWidth: 4,
              fill: color,
              fillOpacity: 1
            }}
          />
          <SparklinesSpots />
        </Sparklines>
      );
    } else {
      component = (
        <MemoryFiller percentage={this.props.percentage} color={color} />
      );
    }

    return (
      <div className="jp-MemoryBar" onClick={() => this.toggleSparklines()}>
        {component}
      </div>
    );
  }
}

export class MemoryView extends VDomRenderer<MemoryModel> {
  constructor(refreshRate: number = 5000) {
    super();
    this.model = new MemoryModel({ refreshRate });
  }

  render() {
    if (!this.model) {
      return null;
    }
    const {
      memoryLimit,
      currentMemory,
      units,
      percentage,
      values
    } = this.model;
    const precision = ["B", "KB", "MB"].indexOf(units) > 0 ? 0 : 2;
    const text = `${currentMemory.toFixed(precision)} ${
      memoryLimit ? "/ " + memoryLimit.toFixed(precision) : ""
    } ${units}`;
    return (
      <div
        className="jp-MemoryContainer"
        style={percentage && { width: "200px" }}
      >
        <div className="jp-MemoryText">Mem: </div>
        <div className="jp-MemoryWrapper">
          {percentage && <MemoryBar data={values} percentage={percentage} />}
        </div>
        <div className="jp-MemoryText">{text}</div>
      </div>
    );
  }
}

class MemoryModel extends MemoryUsage.Model {
  constructor(options: MemoryUsage.Model.IOptions) {
    super(options);
    this._values = new Array(N_BUFFER).fill(0);
    this._refreshIntervalId = setInterval(
      () => this.updateValues(),
      options.refreshRate
    );
  }

  updateValues() {
    this._percentage = this.memoryLimit
      ? Math.min(this.currentMemory / this.memoryLimit, 1)
      : null;
    this.values.push(this._percentage);
    this.values.shift();
    this.stateChanged.emit(void 0);
  }

  dispose() {
    clearInterval(this._refreshIntervalId);
    super.dispose();
  }

  get values(): number[] {
    return this._values;
  }

  get percentage(): number {
    return this._percentage;
  }

  private _percentage: number | null = null;
  private _values: number[];
  private _refreshIntervalId: any;
}
