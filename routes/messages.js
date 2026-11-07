import express from 'express';
import { Resend } from 'resend';
import Message from '../models/Message.js';
import { verifyToken } from './auth.js';

const router = express.Router();

// Initialize Resend using environment variable only
const resend = new Resend(process.env.RESEND_API_KEY);

// PUBLIC: Submit contact form
router.post('/', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Please fill in all fields.' });
  }

  try {
    // 1. Save to Database for Admin Portal
    const newMessage = new Message({ name, email, message });
    await newMessage.save();

    // 2. Send Email Notification via Resend HTTPS API
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'Portfolio Contact <onboarding@resend.dev>',
        to: process.env.EMAIL_USER || 'johnny06j@gmail.com',
        replyTo: email,
        subject: `📬 New Portfolio Contact from ${name}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px;">
            <h2 style="color: #0284c7; margin-top: 0;">New Message Received</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Message:</strong></p>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #0284c7;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
        `
      });
    }

    res.status(200).json({ success: true, message: 'Message sent successfully!' });
  } catch (err) {
    console.error('Contact Form / Resend Error:', err.message || err);
    res.status(200).json({ success: true, message: 'Message received and saved!' });
  }
});

// ADMIN ONLY: Fetch all messages
router.get('/', verifyToken, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// ADMIN ONLY: Toggle read status
router.put('/:id/read', verifyToken, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    msg.read = !msg.read;
    await msg.save();
    res.status(200).json({ success: true, read: msg.read });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update message status.' });
  }
});

// ADMIN ONLY: Delete a message
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message.' });
  }
});

export default router;