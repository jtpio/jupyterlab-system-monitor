// Some parts of this code is adapted from:
// https://github.com/jupyterlab/jupyterlab/blob/22cbc926e59443c67a80fcd363bb2de653087910/packages/statusbar/src/defaults/memoryUsage.tsx
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { URLExt } from '@jupyterlab/coreutils';

import { ServerConnection } from '@jupyterlab/services';

import { Poll } from '@lumino/polling';

import { ISignal, Signal } from '@lumino/signaling';

/**
 * Number of values to keep in memory.
 */
const N_BUFFER = 20;

/**
 * A namespace for ResourcUsage statics.
 */
export namespace ResourceUsage {
  /**
   * A model for the resource usage items.
   */
  export class Model {
    /**
     * Construct a new resource usage model.
     *
     * @param options The options for creating the model.
     */
    constructor(options: Model.IOptions) {
      for (let i = 0; i < N_BUFFER; i++) {
        this._values.push({ memoryPercent: 0, cpuPercent: 0 });
      }
      this._poll = new Poll<Private.IMetricRequestResult | null>({
        factory: (): Promise<Private.IMetricRequestResult> => Private.factory(),
        frequency: {
          interval: options.refreshRate,
          backoff: true,
        },
        name: 'jupyterlab-system-monitor:ResourceUsage#metrics',
      });
      this._poll.ticked.connect((poll) => {
        const { payload, phase } = poll.state;
        if (phase === 'resolved') {
          this._updateMetricsValues(payload);
          return;
        }
        if (phase === 'rejected') {
          const oldMemoryAvailable = this._memoryAvailable;
          const oldCpuAvailable = this._cpuAvailable;
          this._memoryAvailable = false;
          this._cpuAvailable = false;
          this._currentMemory = 0;
          this._memoryLimit = null;
          this._cpuLimit = null;
          this._units = 'B';

          if (oldMemoryAvailable || oldCpuAvailable) {
            this._changed.emit();
          }
          return;
        }
      });
    }

    /**
     * A promise that resolves after the next request.
     */
    async refresh(): Promise<void> {
      await this._poll.refresh();
      await this._poll.tick;
    }

    /**
     * Whether the memory metric is available.
     */
    get memoryAvailable(): boolean {
      return this._memoryAvailable;
    }

    /**
     * Whether the cpu metric is available.
     */
    get cpuAvailable(): boolean {
      return this._cpuAvailable;
    }

    /**
     * The current memory usage.
     */
    get currentMemory(): number {
      return this._currentMemory;
    }

    /**
     * The current memory limit, or null if not specified.
     */
    get memoryLimit(): number | null {
      return this._memoryLimit;
    }

    /**
     * The current cpu limit, or null if not specified.
     */
    get cpuLimit(): number | null {
      return this._cpuLimit;
    }

    /**
     * The units for memory usages and limits.
     */
    get units(): MemoryUnit {
      return this._units;
    }

    /**
     * The current cpu percent.
     */
    get currentCpuPercent(): number {
      return this._currentCpuPercent;
    }

    /**
     * A signal emitted when the resource usage model changes.
     */
    get changed(): ISignal<ResourceUsage.Model, void> {
      return this._changed;
    }

    /**
     * Get a list of the last metric values.
     */
    get values(): Model.IMetricValue[] {
      return this._values;
    }

    /**
     * Dispose of the memory usage model.
     */
    dispose(): void {
      this._poll.dispose();
    }

    /**
     * Given the results of the metrics request, update model values.
     *
     * @param value The metric request result.
     */
    private _updateMetricsValues(
      value: Private.IMetricRequestResult | null
    ): void {
      if (value === null) {
        this._memoryAvailable = false;
        this._cpuAvailable = false;
        this._currentMemory = 0;
        this._memoryLimit = null;
        this._units = 'B';
        return;
      }

      const numBytes = value.rss;
      const memoryLimit = value.limits.memory ? value.limits.memory.rss : null;
      const [currentMemory, units] = Private.convertToLargestUnit(numBytes);
      this._memoryAvailable = numBytes !== undefined;
      this._currentMemory = currentMemory;
      this._units = units;
      this._memoryLimit = memoryLimit
        ? memoryLimit / Private.MEMORY_UNIT_LIMITS[units]
        : null;

      const memoryPercent = this.memoryLimit
        ? Math.min(this._currentMemory / this.memoryLimit, 1)
        : null;

      const cpuPercent = value.cpu_percent;
      this._cpuLimit = value.limits.cpu ? value.limits.cpu.cpu : 1;
      this._cpuAvailable = cpuPercent !== undefined;
      this._currentCpuPercent = this._cpuAvailable ? cpuPercent / 100 : 0;

      this._values.push({ memoryPercent, cpuPercent: this._currentCpuPercent });
      this._values.shift();
      this._changed.emit(void 0);
    }

    private _memoryAvailable = false;
    private _cpuAvailable = false;
    private _currentMemory = 0;
    private _currentCpuPercent = 0;
    private _memoryLimit: number | null = null;
    private _cpuLimit: number | null = null;
    private _poll: Poll<Private.IMetricRequestResult | null>;
    private _units: MemoryUnit = 'B';
    private _changed = new Signal<this, void>(this);
    private _values: Model.IMetricValue[] = [];
  }

  /**
   * A namespace for Model statics.
   */
  export namespace Model {
    /**
     * Options for creating a ResourceUsage model.
     */
    export interface IOptions {
      /**
       * The refresh rate (in ms) for querying the server.
       */
      refreshRate: number;
    }

    /**
     * An interface for metric values.
     */
    export interface IMetricValue {
      /**
       * The memory percentage.
       */
      memoryPercent: number | null;

      /**
       * The cpu percentage.
       */
      cpuPercent: number | null;
    }
  }

  /**
   * The type of unit used for reporting memory usage.
   */
  export type MemoryUnit = 'B' | 'KB' | 'MB' | 'GB' | 'TB' | 'PB';
}

/**
 * A namespace for module private statics.
 */
namespace Private {
  /**
   * The number of decimal places to use when rendering memory usage.
   */
  export const DECIMAL_PLACES = 2;

  /**
   * The number of bytes in each memory unit.
   */
  export const MEMORY_UNIT_LIMITS: {
    readonly [U in ResourceUsage.MemoryUnit]: number;
  } = {
    B: 1,
    KB: 1024,
    MB: 1048576,
    GB: 1073741824,
    TB: 1099511627776,
    PB: 1125899906842624,
  };

  /**
   * Given a number of bytes, convert to the most human-readable
   * format, (GB, TB, etc).
   *
   * @param numBytes The number of bytes.
   */
  export const convertToLargestUnit = (
    numBytes: number
  ): [number, ResourceUsage.MemoryUnit] => {
    if (numBytes < MEMORY_UNIT_LIMITS.KB) {
      return [numBytes, 'B'];
    } else if (
      MEMORY_UNIT_LIMITS.KB === numBytes ||
      numBytes < MEMORY_UNIT_LIMITS.MB
    ) {
      return [numBytes / MEMORY_UNIT_LIMITS.KB, 'KB'];
    } else if (
      MEMORY_UNIT_LIMITS.MB === numBytes ||
      numBytes < MEMORY_UNIT_LIMITS.GB
    ) {
      return [numBytes / MEMORY_UNIT_LIMITS.MB, 'MB'];
    } else if (
      MEMORY_UNIT_LIMITS.GB === numBytes ||
      numBytes < MEMORY_UNIT_LIMITS.TB
    ) {
      return [numBytes / MEMORY_UNIT_LIMITS.GB, 'GB'];
    } else if (
      MEMORY_UNIT_LIMITS.TB === numBytes ||
      numBytes < MEMORY_UNIT_LIMITS.PB
    ) {
      return [numBytes / MEMORY_UNIT_LIMITS.TB, 'TB'];
    } else {
      return [numBytes / MEMORY_UNIT_LIMITS.PB, 'PB'];
    }
  };

  /**
   * Settings for making requests to the server.
   */
  const SERVER_CONNECTION_SETTINGS = ServerConnection.makeSettings();

  /**
   * The url endpoint for making requests to the server.
   */
  const METRIC_URL = URLExt.join(
    SERVER_CONNECTION_SETTINGS.baseUrl,
    'api/metrics/v1'
  );

  /**
   * The shape of a response from the metrics server extension.
   */
  export interface IMetricRequestResult {
    rss: number;
    cpu_percent?: number;
    cpu_count?: number;
    limits: {
      memory?: {
        rss: number;
        warn?: number;
      };
      cpu?: {
        cpu: number;
        warn?: number;
      };
    };
  }

  /**
   * Make a request to the backend.
   */
  export const factory = async (): Promise<IMetricRequestResult | null> => {
    const request = ServerConnection.makeRequest(
      METRIC_URL,
      {},
      SERVER_CONNECTION_SETTINGS
    );
    const response = await request;

    if (response.ok) {
      return await response.json();
    }

    return null;
  };
}
