import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import {
  ACTION_TYPES,
  BULK_ACTION_STATUSES,
  ENTITY_TYPES,
} from '../constants.js';

const bulkActionSchema = new Schema(
  {
    accountId: { type: String, required: true, index: true },
    entityType: {
      type: String,
      enum: ENTITY_TYPES,
      required: true,
      default: 'contact',
    },
    actionType: {
      type: String,
      enum: ACTION_TYPES,
      required: true,
      default: 'bulk_update',
    },
    status: {
      type: String,
      enum: BULK_ACTION_STATUSES,
      required: true,
      default: 'queued',
      index: true,
    },
    payload: {
      filters: { type: Schema.Types.Mixed },
      entityIds: [{ type: String }],
      updates: { type: Schema.Types.Mixed },
    },
    totalCount: { type: Number, default: 0 },
    processedCount: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    failureCount: { type: Number, default: 0 },
    skippedCount: { type: Number, default: 0 },
    jobId: { type: String, default: null },
    error: { type: String, default: null },
    scheduledAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

bulkActionSchema.index({ accountId: 1, createdAt: -1 });
bulkActionSchema.index({ accountId: 1, status: 1 });

export type BulkActionDocument = InferSchemaType<typeof bulkActionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const BulkAction: Model<BulkActionDocument> =
  (mongoose.models.BulkAction as Model<BulkActionDocument>) ||
  mongoose.model<BulkActionDocument>('BulkAction', bulkActionSchema);
