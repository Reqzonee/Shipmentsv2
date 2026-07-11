import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { COMPANY_STATUSES } from '../constants.js';

const companySchema = new Schema(
  {
    accountId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    industry: { type: String, default: 'General' },
    status: {
      type: String,
      enum: COMPANY_STATUSES,
      default: 'prospect',
      index: true,
    },
  },
  { timestamps: true }
);

companySchema.index({ accountId: 1, email: 1 }, { unique: true });
companySchema.index({ accountId: 1, status: 1 });

export type CompanyDocument = InferSchemaType<typeof companySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Company: Model<CompanyDocument> =
  (mongoose.models.Company as Model<CompanyDocument>) ||
  mongoose.model<CompanyDocument>('Company', companySchema);
