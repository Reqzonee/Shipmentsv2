import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { CONTACT_STATUSES } from '../constants.js';

const contactSchema = new Schema(
  {
    accountId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    age: { type: Number, required: true, min: 0, max: 150 },
    status: {
      type: String,
      enum: CONTACT_STATUSES,
      default: 'lead',
      index: true,
    },
  },
  { timestamps: true }
);

contactSchema.index({ accountId: 1, email: 1 }, { unique: true });
contactSchema.index({ accountId: 1, status: 1 });
contactSchema.index({ accountId: 1, createdAt: -1 });

export type ContactDocument = InferSchemaType<typeof contactSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Contact: Model<ContactDocument> =
  (mongoose.models.Contact as Model<ContactDocument>) ||
  mongoose.model<ContactDocument>('Contact', contactSchema);
