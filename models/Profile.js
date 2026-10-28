import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
  {
    name: { type: String, default: 'Johnny' },
    avatarUrl: { type: String, default: '' },
    bannerUrl: { type: String, default: '' },
    bioShort: {
      type: String,
      default:
        "Hi, I'm Johnny, a Full-Stack Developer who builds practical web applications that solve real-world problems. I work with React, JavaScript, Node.js, Express, and MongoDB to turn ideas into functional digital solutions.",
    },
    bioFull: {
      type: String,
      default:
        'I focus on building reliable software with clean user interfaces, functional backends, and simple workflows.',
    },
    aboutImageUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Profile', profileSchema);