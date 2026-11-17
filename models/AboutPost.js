import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    author: { type: String, default: 'Visitor' },
    avatar: { type: String, default: '' },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

const threadItemSchema = new mongoose.Schema({
  content: { type: String, required: true },
  media: [
    {
      url: { type: String, required: true },
      resourceType: { type: String, enum: ['image', 'video'], default: 'image' },
    },
  ],
});

const aboutPostSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    media: [
      {
        url: { type: String, required: true },
        resourceType: { type: String, enum: ['image', 'video'], default: 'image' },
      },
    ],
    threadItems: [threadItemSchema],
    pinOrder: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: String }],
    views: { type: Number, default: 0 },
    comments: [commentSchema],
  },
  { timestamps: true }
);

export default mongoose.model('AboutPost', aboutPostSchema);