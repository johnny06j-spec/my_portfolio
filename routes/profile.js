import express from 'express';
import Profile from '../models/Profile.js';
import { verifyToken } from '../middleware/auth.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    let profile = await Profile.findOne();
    if (!profile) profile = await Profile.create({});
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.post(
  '/',
  verifyToken,
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      let profile = await Profile.findOne();
      if (!profile) profile = new Profile();

      if (req.files?.avatar?.[0]) profile.avatarUrl = req.files.avatar[0].path;
      if (req.files?.banner?.[0]) profile.bannerUrl = req.files.banner[0].path;
      if (req.body.bioShort !== undefined) profile.bioShort = req.body.bioShort;

      await profile.save();
      res.json({ success: true, profile });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update profile header' });
    }
  }
);

export default router;