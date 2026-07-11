import type { Model } from 'mongoose';
import { listEntityDefs } from '@shipments/shared';
import { GenericBulkUpdateHandler } from './GenericBulkUpdateHandler.js';
import type { BulkActionHandler } from './types.js';

const registry = new Map<string, BulkActionHandler>();

for (const def of listEntityDefs()) {
  const updatable = new Set(def.fields.filter((f) => f.updatable).map((f) => f.key));
  register(
    new GenericBulkUpdateHandler(
      def.type,
      def.model as Model<any>,
      def.dedupeField,
      updatable
    )
  );
}

function register(handler: BulkActionHandler) {
  registry.set(handler.key, handler);
}

export function getHandler(
  entityType: string,
  actionType: string
): BulkActionHandler | undefined {
  return registry.get(`${entityType}:${actionType}`);
}

export function listHandlers(): string[] {
  return [...registry.keys()];
}
