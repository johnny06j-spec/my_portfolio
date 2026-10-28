import express from 'express';
import Project from '../models/Project.js';
import { verifyToken } from '../middleware/auth.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

// GET all projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// POST Create Project with thread updates
router.post('/', verifyToken, upload.any(), async (req, res) => {
  try {
    const mainMedia = [];
    const updateMediaMap = {};

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const item = {
          url: file.path,
          resourceType: file.mimetype.startsWith('video') ? 'video' : 'image',
        };

        if (file.fieldname === 'mediaFiles') {
          mainMedia.push(item);
        } else if (file.fieldname.startsWith('updateMedia_')) {
          const index = file.fieldname.split('_')[1];
          if (!updateMediaMap[index]) updateMediaMap[index] = [];
          updateMediaMap[index].push(item);
        }
      }
    }

    let parsedUpdates = [];
    if (req.body.projectUpdates) {
      try {
        parsedUpdates = JSON.parse(req.body.projectUpdates);
      } catch (e) {
        parsedUpdates = [];
      }
    }

    const projectUpdates = parsedUpdates.map((upd, idx) => ({
      title: upd.title || '',
      description: upd.description || '',
      media: updateMediaMap[idx] || [],
    }));

    const tags = req.body.tags ? JSON.parse(req.body.tags) : [];
    const highlights = req.body.highlights ? JSON.parse(req.body.highlights) : [];

    const newProject = new Project({
      title: req.body.title,
      category: req.body.category,
      description: req.body.description,
      liveUrl: req.body.liveUrl,
      tags,
      highlights,
      media: mainMedia,
      projectUpdates,
    });

    await newProject.save();
    res.json({ success: true, project: newProject });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create project: ' + err.message });
  }
});

// PUT Edit Project
router.put('/:id', verifyToken, upload.any(), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (req.body.title) project.title = req.body.title;
    if (req.body.category) project.category = req.body.category;
    if (req.body.description) project.description = req.body.description;
    if (req.body.liveUrl) project.liveUrl = req.body.liveUrl;
    if (req.body.tags) project.tags = JSON.parse(req.body.tags);
    if (req.body.highlights) project.highlights = JSON.parse(req.body.highlights);

    const newMainMedia = [];
    const updateMediaMap = {};

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const item = {
          url: file.path,
          resourceType: file.mimetype.startsWith('video') ? 'video' : 'image',
        };

        if (file.fieldname === 'mediaFiles') {
          newMainMedia.push(item);
        } else if (file.fieldname.startsWith('updateMedia_')) {
          const index = file.fieldname.split('_')[1];
          if (!updateMediaMap[index]) updateMediaMap[index] = [];
          updateMediaMap[index].push(item);
        }
      }
    }

    if (newMainMedia.length > 0) {
      project.media.push(...newMainMedia);
    }

    if (req.body.projectUpdates) {
      try {
        const parsedUpdates = JSON.parse(req.body.projectUpdates);
        project.projectUpdates = parsedUpdates.map((upd, idx) => {
          const existingMedia = upd.media || [];
          const uploadedMedia = updateMediaMap[idx] || [];
          return {
            title: upd.title || '',
            description: upd.description || '',
            media: [...existingMedia, ...uploadedMedia],
          };
        });
      } catch (e) {
        console.error('Update parse error');
      }
    }

    await project.save();
    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE Project
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;