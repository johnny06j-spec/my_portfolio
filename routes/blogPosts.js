import express from 'express';
import BlogPost from '../models/BlogPost.js';
import { verifyToken } from '../middleware/auth.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

// GET all blog posts (newest first)
router.get('/', async (req, res) => {
  try {
    const posts = await BlogPost.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

// POST create a new blog post (supports images/videos, song/audio, and PDF/doc)
router.post(
  '/',
  verifyToken,
  upload.fields([
    { name: 'blogMedia', maxCount: 10 },
    { name: 'blogAudio', maxCount: 1 },
    { name: 'blogDocument', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const media = [];
      if (req.files?.blogMedia) {
        for (const file of req.files.blogMedia) {
          media.push({
            url: file.path,
            resourceType: file.mimetype.startsWith('video') ? 'video' : 'image',
          });
        }
      }

      let audio = { url: '', title: '' };
      if (req.files?.blogAudio?.[0]) {
        const audioFile = req.files.blogAudio[0];
        audio = {
          url: audioFile.path,
          title: req.body.audioTitle?.trim() || audioFile.originalname,
        };
      }

      let document = { url: '', name: '' };
      if (req.files?.blogDocument?.[0]) {
        const docFile = req.files.blogDocument[0];
        document = {
          url: docFile.path,
          name: req.body.documentName?.trim() || docFile.originalname,
        };
      }

      const newPost = new BlogPost({
        title: req.body.title?.trim() || '',
        category: req.body.category || 'Dev Journey',
        content: req.body.content,
        media,
        audio,
        document,
      });

      await newPost.save();
      res.json({ success: true, post: newPost });
    } catch (err) {
      console.error('Blog create error:', err);
      res.status(500).json({ error: 'Failed to publish blog post: ' + err.message });
    }
  }
);

// PUT edit an existing blog post
router.put(
  '/:id',
  verifyToken,
  upload.fields([
    { name: 'blogMedia', maxCount: 10 },
    { name: 'blogAudio', maxCount: 1 },
    { name: 'blogDocument', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const post = await BlogPost.findById(req.params.id);
      if (!post) return res.status(404).json({ error: 'Blog post not found' });

      if (req.body.title !== undefined) post.title = req.body.title.trim();
      if (req.body.category) post.category = req.body.category;
      if (req.body.content) post.content = req.body.content;

      if (req.files?.blogMedia) {
        for (const file of req.files.blogMedia) {
          post.media.push({
            url: file.path,
            resourceType: file.mimetype.startsWith('video') ? 'video' : 'image',
          });
        }
      }

      if (req.files?.blogAudio?.[0]) {
        const audioFile = req.files.blogAudio[0];
        post.audio = {
          url: audioFile.path,
          title: req.body.audioTitle?.trim() || audioFile.originalname,
        };
      } else if (req.body.audioTitle !== undefined && post.audio?.url) {
        post.audio.title = req.body.audioTitle.trim();
      }

      if (req.files?.blogDocument?.[0]) {
        const docFile = req.files.blogDocument[0];
        post.document = {
          url: docFile.path,
          name: req.body.documentName?.trim() || docFile.originalname,
        };
      } else if (req.body.documentName !== undefined && post.document?.url) {
        post.document.name = req.body.documentName.trim();
      }

      await post.save();
      res.json({ success: true, post });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update blog post' });
    }
  }
);

// DELETE blog post
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await BlogPost.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

// LIKE / UNLIKE TOGGLE
router.post('/:id/like', async (req, res) => {
  try {
    const { visitorId } = req.body;
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    if (!Array.isArray(post.likedBy)) post.likedBy = [];
    let liked = false;

    if (visitorId) {
      const idx = post.likedBy.indexOf(visitorId);
      if (idx > -1) {
        post.likedBy.splice(idx, 1);
        post.likes = Math.max(0, (post.likes || 0) - 1);
        liked = false;
      } else {
        post.likedBy.push(visitorId);
        post.likes = (post.likes || 0) + 1;
        liked = true;
      }
    } else {
      post.likes = (post.likes || 0) + 1;
      liked = true;
    }

    await post.save();
    res.json({ success: true, likes: post.likes, liked });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// VIEWS INCREMENT
router.post('/:id/view', async (req, res) => {
  try {
    const post = await BlogPost.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ success: true, views: post.views });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record view' });
  }
});

// ADD COMMENT
router.post('/:id/comment', async (req, res) => {
  try {
    const { author, avatar, text } = req.body;
    if (!text) return res.status(400).json({ error: 'Comment text is required' });

    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    post.comments.push({
      author: author || 'Visitor',
      avatar: avatar || '',
      text,
    });
    await post.save();
    res.json({ success: true, comments: post.comments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

export default router;