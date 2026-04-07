require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

console.log('SMTP_USER:', process.env.SMTP_USER ? 'loaded' : 'MISSING');
console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? 'loaded' : 'MISSING');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.privateemail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  },
  tls: { rejectUnauthorized: false }
});

const buildTemplate = (jobTitle, companyName, assessmentLink) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Assessment Invitation</title>
  <style>
    body, html {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      background-color: #f0f2f5;
      -webkit-font-smoothing: antialiased;
    }
    .main-container {
      background-color: #f0f2f5;
      padding: 60px 20px;
    }
    .email-wrapper {
      max-width: 680px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(26, 43, 74, 0.12);
      overflow: hidden;
    }
    .email-header {
      background: linear-gradient(135deg, #ff6b35 0%, #e65a28 100%);
      padding: 40px 60px;
      text-align: center;
    }
    .email-header .brand {
      font-size: 36px;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: 1px;
    }
    .email-header .tagline {
      font-size: 13px;
      color: rgba(255,255,255,0.9);
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-top: 6px;
    }
    .email-body {
      padding: 48px 60px;
      color: #374151;
      font-size: 15px;
      line-height: 1.7;
    }
    .email-body p {
      margin: 0 0 16px 0;
    }
    .btn-group {
      text-align: center;
      margin: 32px 0 20px 0;
    }
    .btn-primary {
      display: inline-block;
      background-color: #ff6b35;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 15px;
      font-weight: 700;
      padding: 14px 32px;
      border-radius: 50px;
      margin: 6px 8px;
      box-shadow: 0 4px 12px rgba(255, 107, 53, 0.35);
      letter-spacing: 0.3px;
    }
    .url-box {
      background-color: #f4f6f9;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 20px;
      margin: 16px 0 28px 0;
    }
    .url-box .url-label {
      font-size: 11px;
      font-weight: 700;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }
    .url-box .url-text {
      color: #374151;
      word-break: break-all;
      font-size: 13px;
      font-family: monospace;
    }
    .email-footer {
      background-color: #f8fafc;
      padding: 28px 60px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      font-size: 13px;
      color: #9ca3af;
    }
    @media only screen and (max-width: 600px) {
      .email-body, .email-header, .email-footer { padding-left: 28px; padding-right: 28px; }
    }
  </style>
</head>
<body>
  <div class="main-container">
    <div class="email-wrapper">
      <div class="email-header">
        <div class="brand">QualityAssist</div>
        <div class="tagline">&#10022; Connecting Talent with Opportunity &#10022;</div>
      </div>
      <div class="email-body">
        <p>Hello,</p>
        <p>You have been invited to complete an online assessment as part of the hiring process for the <strong>${jobTitle}</strong> position with <strong>${companyName}</strong>.</p>
        <p>This assessment is administered through <strong>Quality-Assist.com</strong>.</p>
        <p>Please use the secure link below to access the assessment:</p>
        <div class="btn-group">
          <a href="${assessmentLink}" class="btn-primary">&#9654;&nbsp; Start Assessment</a>
        </div>
        <div class="url-box">
          <div class="url-label">Invitation URL</div>
          <div class="url-text">${assessmentLink}</div>
        </div>
        <p>The assessment should take approximately <strong>15 minutes</strong> to complete. Please ensure you complete it within the requested timeframe.</p>
        <p>If you experience any technical difficulties, please contact the Quality-Assist support team.</p>
        <p>Thank you for your participation.</p>
        <p style="margin-top: 24px; color: #1a2b4a; font-weight: 700;">Quality-Assist Team</p>
      </div>
      <div class="email-footer">
        &copy; ${new Date().getFullYear()} Quality-Assist. All rights reserved.<br>
        This is an automated email. Please do not reply.
      </div>
    </div>
  </div>
</body>
</html>`;

app.post('/api/send', async (req, res) => {
  const { email, jobTitle, companyName, assessmentLink } = req.body;

  if (!email || !jobTitle || !companyName || !assessmentLink) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const html = buildTemplate(jobTitle, companyName, assessmentLink);
    await transporter.sendMail({
      from: `"${process.env.SENDER_NAME || 'QualityAssist'}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `${companyName} \u2013 Assessment Invitation`,
      html
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Send error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Email sender running on http://localhost:${PORT}`));
