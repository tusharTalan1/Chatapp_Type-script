import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  room: string;
  sender: string;
  content: string;
  createdAt: Date;
}

const messageSchema: Schema = new mongoose.Schema({
  room: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<IMessage>('Message', messageSchema);
