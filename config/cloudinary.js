import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith('video');
    const isAudio = file.mimetype.startsWith('audio');
    const isDocument =
      file.fieldname === 'cv' ||
      file.fieldname === 'blogDocument' ||
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (isDocument) {
      return {
        folder: 'portfolio_documents',
        resource_type: 'raw',
        public_id: `doc_${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
      };
    }

    if (isAudio) {
      return {
        folder: 'portfolio_audio',
        resource_type: 'video', // Cloudinary stores audio under 'video' resource_type
        public_id: `audio_${Date.now()}_${file.originalname.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_')}`,
      };
    }

    return {
      folder: 'portfolio_projects',
      resource_type: isVideo ? 'video' : 'image',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'mp4', 'mov', 'webm', 'mkv'],
    };
  },
});

export const upload = multer({ storage });