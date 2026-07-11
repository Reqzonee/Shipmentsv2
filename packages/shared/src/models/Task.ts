import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { TASK_STATUSES } from '../constants.js';

const taskSchema = new Schema(
  {
    accountId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true }, // task title
    email: { type: String, required: true, trim: true, lowercase: true }, // assignee
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: 'todo',
      index: true,
    },
  },
  { timestamps: true }
);

taskSchema.index({ accountId: 1, email: 1, name: 1 });
taskSchema.index({ accountId: 1, status: 1 });

export type TaskDocument = InferSchemaType<typeof taskSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Task: Model<TaskDocument> =
  (mongoose.models.Task as Model<TaskDocument>) ||
  mongoose.model<TaskDocument>('Task', taskSchema);
