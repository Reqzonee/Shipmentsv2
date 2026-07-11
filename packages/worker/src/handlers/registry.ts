import { BulkUpdateHandler } from './BulkUpdateHandler.js';
import type { BulkActionHandler } from './types.js';

const registry = new Map<string, BulkActionHandler>();

function register(handler: BulkActionHandler) {
  registry.set(handler.key, handler);
}

register(new BulkUpdateHandler());

export function getHandler(
  entityType: string,
  actionType: string
): BulkActionHandler | undefined {
  return registry.get(`${entityType}:${actionType}`);
}

export function listHandlers(): string[] {
  return [...registry.keys()];
}
