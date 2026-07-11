import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { ENTITY_TYPES, LOG_STATUSES } from '../constants.js';

const bulkActionLogSchema = new Schema(
  {
    actionId: {
      type: Schema.Types.ObjectId,
      ref: 'BulkAction',
      required: true,
      index: true,
    },
    accountId: { type: String, required: true, index: true },
    entityId: { type: String, required: true },
    entityType: {
      type: String,
      enum: ENTITY_TYPES,
      required: true,
      default: 'contact',
    },
    status: {
      type: String,
      enum: LOG_STATUSES,
      required: true,
      index: true,
    },
    message: { type: String, default: null },
    error: { type: String, default: null },
    metadata: {
      previousValues: { type: Schema.Types.Mixed },
      newValues: { type: Schema.Types.Mixed },
    },
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

bulkActionLogSchema.index({ actionId: 1, status: 1 });
bulkActionLogSchema.index({ actionId: 1, processedAt: 1 });
bulkActionLogSchema.index({ accountId: 1, actionId: 1 });

export type BulkActionLogDocument = InferSchemaType<typeof bulkActionLogSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const BulkActionLog: Model<BulkActionLogDocument> =
  (mongoose.models.BulkActionLog as Model<BulkActionLogDocument>) ||
  mongoose.model<BulkActionLogDocument>('BulkActionLog', bulkActionLogSchema);
