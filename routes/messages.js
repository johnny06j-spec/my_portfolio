import express from 'express';
import nodemailer from 'nodemailer';
import Message from '../models/Message.js';
import { verifyToken } from './auth.js';

const router = express.Router();

// Transporter setup for email dispatch (Port 465 SSL prevents Render ETIMEDOUT)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS  // Gmail App Password
  }
});

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

    // 2. Dispatch Notification Email
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const mailOptions = {
        from: `"${name} (Portfolio Inquiry)" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
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
      };

      await transporter.sendMail(mailOptions);
    }

    res.status(200).json({ success: true, message: 'Message sent successfully!' });
  } catch (err) {
    console.error('Contact Form / Nodemailer Error:', err.message || err);
    res.status(500).json({ error: 'Failed to process message. Please try again.' });
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