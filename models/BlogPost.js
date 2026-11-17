import mongoose from 'mongoose';

const blogCommentSchema = new mongoose.Schema(
  {
    author: { type: String, default: 'Visitor' },
    avatar: { type: String, default: '' },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

const blogPostSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    category: {
      type: String,
      enum: ['Dev Journey', 'Lifestyle', 'Thoughts', 'Music & Vibes', 'Resources'],
      default: 'Dev Journey',
    },
    content: { type: String, required: true },
    media: [
      {
        url: { type: String, required: true },
        resourceType: { type: String, enum: ['image', 'video'], default: 'image' },
      },
    ],
    audio: {
      url: { type: String, default: '' },
      title: { type: String, default: '' },
    },
    document: {
      url: { type: String, default: '' },
      name: { type: String, default: '' },
    },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: String }],
    views: { type: Number, default: 0 },
    comments: [blogCommentSchema],
  },
  { timestamps: true }
);

export default mongoose.model('BlogPost', blogPostSchema);