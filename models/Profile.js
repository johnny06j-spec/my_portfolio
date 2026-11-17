import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
  {
    avatarUrl: { type: String, default: '' },
    bannerUrl: { type: String, default: '' },
    cvUrl: { type: String, default: '' },
    bioShort: { type: String, default: '' },
    bioFull: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Profile', profileSchema);