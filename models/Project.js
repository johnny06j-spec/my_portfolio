import mongoose from 'mongoose';

const projectUpdateSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  description: { type: String, required: true },
  media: [
    {
      url: { type: String, required: true },
      resourceType: { type: String, enum: ['image', 'video'], default: 'image' },
    },
  ],
});

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    liveUrl: { type: String, required: true },
    tags: [{ type: String }],
    highlights: [{ type: String }],
    media: [
      {
        url: { type: String, required: true },
        resourceType: { type: String, enum: ['image', 'video'], default: 'image' },
      },
    ],
    projectUpdates: [projectUpdateSchema], // Chained project thread updates
  },
  { timestamps: true }
);

export default mongoose.model('Project', projectSchema);