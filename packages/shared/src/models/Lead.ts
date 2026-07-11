import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { LEAD_STATUSES } from '../constants.js';

const leadSchema = new Schema(
  {
    accountId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    source: { type: String, default: 'web' },
    status: {
      type: String,
      enum: LEAD_STATUSES,
      default: 'new',
      index: true,
    },
  },
  { timestamps: true }
);

leadSchema.index({ accountId: 1, email: 1 }, { unique: true });
leadSchema.index({ accountId: 1, status: 1 });

export type LeadDocument = InferSchemaType<typeof leadSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Lead: Model<LeadDocument> =
  (mongoose.models.Lead as Model<LeadDocument>) ||
  mongoose.model<LeadDocument>('Lead', leadSchema);
