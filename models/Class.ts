import mongoose, { Schema, model, models } from 'mongoose';

export interface IClass {
  name: string;
  grade: number;
  createdAt: Date;
}

const ClassSchema = new Schema<IClass>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  grade: {
    type: Number,
    required: true,
    enum: [3, 4, 5],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default models.Class || model<IClass>('Class', ClassSchema);
