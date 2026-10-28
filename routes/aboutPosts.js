import express from 'express';
import AboutPost from '../models/AboutPost.js';
import { verifyToken } from '../middleware/auth.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

// GET all about posts
router.get('/', async (req, res) => {
  try {
    const posts = await AboutPost.find();
    posts.sort((a, b) => {
      if (a.pinOrder > 0 && b.pinOrder > 0) return a.pinOrder - b.pinOrder;
      if (a.pinOrder > 0) return -1;
      if (b.pinOrder > 0) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch about posts' });
  }
});

// QUICK PIN UPDATE
router.put('/:id/pin', verifyToken, async (req, res) => {
  try {
    const { pinOrder } = req.body;
    const post = await AboutPost.findByIdAndUpdate(
      req.params.id,
      { pinOrder: Number(pinOrder) || 0 },
      { new: true }
    );
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update pin order' });
  }
});

// POST Create Post / Thread with step-by-step media
router.post('/', verifyToken, upload.any(), async (req, res) => {
  try {
    const mainMedia = [];
    const threadMediaMap = {};

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const item = {
          url: file.path,
          resourceType: file.mimetype.startsWith('video') ? 'video' : 'image',
        };

        if (file.fieldname === 'aboutMediaFiles') {
          mainMedia.push(item);
        } else if (file.fieldname.startsWith('threadMedia_')) {
          const index = file.fieldname.split('_')[1];
          if (!threadMediaMap[index]) threadMediaMap[index] = [];
          threadMediaMap[index].push(item);
        }
      }
    }

    let parsedSteps = [];
    if (req.body.threadItems) {
      try {
        parsedSteps = JSON.parse(req.body.threadItems);
      } catch (e) {
        parsedSteps = [];
      }
    }

    const threadItems = parsedSteps.map((step, idx) => ({
      content: step.content,
      media: threadMediaMap[idx] || [],
    }));

    const newPost = new AboutPost({
      content: req.body.content,
      media: mainMedia,
      threadItems,
      pinOrder: Number(req.body.pinOrder) || 0,
    });

    await newPost.save();
    res.json({ success: true, post: newPost });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create thread: ' + err.message });
  }
});

// PUT Edit Post / Thread
router.put('/:id', verifyToken, upload.any(), async (req, res) => {
  try {
    const post = await AboutPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    if (req.body.content) post.content = req.body.content;
    if (req.body.pinOrder !== undefined) post.pinOrder = Number(req.body.pinOrder);

    const newMainMedia = [];
    const threadMediaMap = {};

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const item = {
          url: file.path,
          resourceType: file.mimetype.startsWith('video') ? 'video' : 'image',
        };

        if (file.fieldname === 'aboutMediaFiles') {
          newMainMedia.push(item);
        } else if (file.fieldname.startsWith('threadMedia_')) {
          const index = file.fieldname.split('_')[1];
          if (!threadMediaMap[index]) threadMediaMap[index] = [];
          threadMediaMap[index].push(item);
        }
      }
    }

    if (newMainMedia.length > 0) {
      post.media.push(...newMainMedia);
    }

    if (req.body.threadItems) {
      try {
        const parsedSteps = JSON.parse(req.body.threadItems);
        post.threadItems = parsedSteps.map((step, idx) => {
          const existingMedia = step.media || [];
          const uploadedMedia = threadMediaMap[idx] || [];
          return {
            content: step.content,
            media: [...existingMedia, ...uploadedMedia],
          };
        });
      } catch (e) {
        console.error('Thread parse error');
      }
    }

    await post.save();
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// DELETE Post
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await AboutPost.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// LIKE endpoint
router.post('/:id/like', async (req, res) => {
  try {
    const post = await AboutPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    post.likes += 1;
    await post.save();
    res.json({ success: true, likes: post.likes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to like post' });
  }
});

// COMMENT endpoint
router.post('/:id/comment', async (req, res) => {
  try {
    const { author, text } = req.body;
    if (!text) return res.status(400).json({ error: 'Comment text is required' });

    const post = await AboutPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    post.comments.push({ author: author || 'Visitor', text });
    await post.save();
    res.json({ success: true, comments: post.comments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

export default router;