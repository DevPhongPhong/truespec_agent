// ============================================================================
// BASE MODEL - Abstract class for all data models
// ============================================================================

import { TimeSeriesPoint } from '../types';

export abstract class BaseModel<T> {
  protected _data: T;
  protected _lastUpdated: Date;

  constructor(data: T) {
    this._data = data;
    this._lastUpdated = new Date();
  }

  get data(): T {
    return this._data;
  }

  get lastUpdated(): Date {
    return this._lastUpdated;
  }

  update(newData: Partial<T>): void {
    this._data = { ...this._data, ...newData };
    this._lastUpdated = new Date();
  }

  abstract validate(): boolean;
  abstract toJSON(): object;
}

// ============================================================================
// METRIC MODEL - Base class for hardware metrics
// ============================================================================

export abstract class MetricModel<T> extends BaseModel<T> {
  protected _history: Map<string, TimeSeriesPoint[]> = new Map();
  protected readonly MAX_HISTORY_POINTS = 60;

  addHistoryPoint(series: string, value: number): void {
    const points = this._history.get(series) || [];
    points.push({
      timestamp: Date.now(),
      value,
    });

    // Keep only last MAX_HISTORY_POINTS
    if (points.length > this.MAX_HISTORY_POINTS) {
      points.shift();
    }

    this._history.set(series, points);
  }

  getHistory(series: string): TimeSeriesPoint[] {
    return this._history.get(series) || [];
  }

  clearHistory(series?: string): void {
    if (series) {
      this._history.delete(series);
    } else {
      this._history.clear();
    }
  }
}

// ============================================================================
// OBSERVABLE MODEL - For reactive updates
// ============================================================================

type Observer<T> = (data: T) => void;

export abstract class ObservableModel<T> extends MetricModel<T> {
  private observers: Set<Observer<T>> = new Set();

  subscribe(observer: Observer<T>): () => void {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  protected notify(): void {
    this.observers.forEach(observer => observer(this._data));
  }

  override update(newData: Partial<T>): void {
    super.update(newData);
    this.notify();
  }
}

