import { Token } from '@lumino/coreutils';
import { ResourceUsage } from './model';

/**
 * An interface for a resource usage instance.
 */
export interface IResourceUsage {
  /**
   * The resource usage model.
   */
  model: ResourceUsage.Model;
}

/**
 * A token for a tracker for resource usage instances.
 */
export const IResourceUsage = new Token<IResourceUsage>(
  'jupyterlab-system-monitor'
);
