import mongoose, { Schema, model, models } from 'mongoose';

export interface IPaper {
  name: string;
  classId: mongoose.Types.ObjectId;
  grade: number;
  isMainPaper: boolean;
  createdAt: Date;
}

const PaperSchema = new Schema<IPaper>({
  name: {
    type: String,
    required: true,
    trim: true,
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
  isMainPaper: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default models.Paper || model<IPaper>('Paper', PaperSchema);
