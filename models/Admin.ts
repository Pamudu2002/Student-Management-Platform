import mongoose, { Schema, model, models } from 'mongoose';

export interface IAdmin {
  username: string;
  password: string;
  createdAt: Date;
}

const AdminSchema = new Schema<IAdmin>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default models.Admin || model<IAdmin>('Admin', AdminSchema);
