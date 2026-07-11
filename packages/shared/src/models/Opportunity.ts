import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { OPPORTUNITY_STAGES } from '../constants.js';

const opportunitySchema = new Schema(
  {
    accountId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    amount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: OPPORTUNITY_STAGES,
      default: 'prospecting',
      index: true,
    },
  },
  { timestamps: true }
);

opportunitySchema.index({ accountId: 1, email: 1 }, { unique: true });
opportunitySchema.index({ accountId: 1, status: 1 });

export type OpportunityDocument = InferSchemaType<typeof opportunitySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Opportunity: Model<OpportunityDocument> =
  (mongoose.models.Opportunity as Model<OpportunityDocument>) ||
  mongoose.model<OpportunityDocument>('Opportunity', opportunitySchema);
