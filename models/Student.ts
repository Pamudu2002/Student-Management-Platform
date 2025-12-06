import mongoose, { Schema, model, models } from 'mongoose';

export interface IStudent {
  name: string;
  indexNumber: string;
  classId: mongoose.Types.ObjectId;
  grade: number;
  createdAt: Date;
}

const StudentSchema = new Schema<IStudent>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  indexNumber: {
    type: String,
    required: true,
    unique: true,
  },
  classId: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  grade: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default models.Student || model<IStudent>('Student', StudentSchema);
