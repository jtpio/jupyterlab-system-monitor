import React from "react";

import { Sparklines, SparklinesLine, SparklinesSpots } from "react-sparklines";

import { MemoryUsage } from "@jupyterlab/statusbar";
import { ReactWidget } from "@jupyterlab/apputils";

const N_BUFFER = 20;

interface IMemoryBarProps {
  values: number[];
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
  constructor(props: IMemoryBarProps) {
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

    return (
      <div className="jp-MemoryBar" onClick={() => this.toggleSparklines()}>
        {this.state.isSparklines && (
          <Sparklines
            data={this.props.values}
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
        )}
        {!this.state.isSparklines && (
          <MemoryFiller percentage={this.props.percentage} color={color} />
        )}
      </div>
    );
  }
}

interface IMemoryUsageProps {
  label: string;
  text: string;
  values: number[];
  percentage: number | null;
}

interface IMemoryUsageState {
  isSparklines: boolean;
}

export class MemoryUsageComponent extends React.Component<
  IMemoryUsageProps,
  IMemoryUsageState
> {
  constructor(props: IMemoryUsageProps) {
    super(props);
  }

  render() {
    return (
      <div
        className="jp-MemoryContainer"
        style={this.props.percentage && { width: "200px" }}
      >
        <div className="jp-MemoryText">{this.props.label}</div>
        <div className="jp-MemoryWrapper">
          {this.props.percentage && (
            <MemoryBar
              values={this.props.values}
              percentage={this.props.percentage}
            />
          )}
        </div>
        <div className="jp-MemoryText">{this.props.text}</div>
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

interface IMemoryViewProps {
  refreshRate: number;
}

interface IMemoryViewState extends IMemoryUsageProps {}

export class MemoryView extends React.Component<
  IMemoryViewProps,
  IMemoryViewState
> {
  constructor(props: IMemoryViewProps) {
    super(props);
    const { refreshRate } = props;
    this.state = {
      label: "Mem:",
      text: "0 / 0 B",
      values: [],
      percentage: null
    };
    this.model = new MemoryModel({ refreshRate });
  }

  handleUpdate = () => {
    if (!this.model) {
      return;
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

    this.setState({
      text,
      values,
      percentage
    });
  };

  componentDidMount = () => {
    this.model.stateChanged.connect(this.handleUpdate);
  };

  componentWillUnmount = () => {
    this.model.stateChanged.disconnect(this.handleUpdate);
  };

  render() {
    return <MemoryUsageComponent {...this.state} />;
  }

  readonly model: MemoryModel;
}

export namespace MemoryView {
  export function createMemoryView(refreshRate: number) {
    return ReactWidget.create(<MemoryView refreshRate={refreshRate} />);
  }
}
