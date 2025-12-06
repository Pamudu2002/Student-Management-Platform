import mongoose, { Schema, model, models } from 'mongoose';

export interface IResult {
  studentId: mongoose.Types.ObjectId;
  paperId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  grade: number;
  marks?: number;
  part1Marks?: number;
  part2Marks?: number;
  totalMarks: number;
  createdAt: Date;
}

const ResultSchema = new Schema<IResult>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  paperId: {
    type: Schema.Types.ObjectId,
    ref: 'Paper',
    required: true,
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
  marks: {
    type: Number,
  },
  part1Marks: {
    type: Number,
  },
  part2Marks: {
    type: Number,
  },
  totalMarks: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default models.Result || model<IResult>('Result', ResultSchema);
