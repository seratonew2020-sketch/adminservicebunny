import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Sends an email to HR when a new time correction request is created
 */
const sendHRAttentionEmail = async (hrEmail, requestData) => {
  if (!process.env.SMTP_USER) {
    console.log('SMTP not configured, skipping email send to HR');
    return;
  }

  const transporter = createTransporter();

  const mailOptions = {
    from: `"TimeTrack Pro" <${process.env.SMTP_USER}>`,
    to: hrEmail,
    subject: `New Time Correction Request: ${requestData.userEmail}`,
    html: `
      <h2>New Time Correction Request</h2>
      <p>A new missed punch request has been submitted and is pending your approval.</p>
      <ul>
        <li><strong>Employee:</strong> ${requestData.userEmail}</li>
        <li><strong>Date:</strong> ${requestData.date}</li>
        <li><strong>Time In:</strong> ${requestData.time_in || '-'}</li>
        <li><strong>Time Out:</strong> ${requestData.time_out || '-'}</li>
        <li><strong>Reason:</strong> ${requestData.reason}</li>
      </ul>
      <p>Please log in to the TimeTrack Pro dashboard to approve or reject this request.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`HR attention email sent to ${hrEmail}`);
  } catch (error) {
    console.error('Failed to send HR attention email:', error);
  }
};

/**
 * Sends an email to Employee when their request is approved or rejected
 */
const sendEmployeeDecisionEmail = async (employeeEmail, requestData, status, hrComment) => {
  if (!process.env.SMTP_USER) {
    console.log('SMTP not configured, skipping email send to Employee');
    return;
  }

  const transporter = createTransporter();
  const isApproved = status === 'approved';

  const statusColor = isApproved ? 'green' : 'red';
  const statusText = isApproved ? 'Approved' : 'Rejected';

  let commentHtml = '';
  if (!isApproved && hrComment) {
    commentHtml = `<p><strong>HR Comment:</strong> ${hrComment}</p>`;
  }

  const mailOptions = {
    from: `"TimeTrack Pro" <${process.env.SMTP_USER}>`,
    to: employeeEmail,
    subject: `Time Correction Request ${statusText}`,
    html: `
      <h2>Time Correction Request Update</h2>
      <p>Your missed punch request for the date <strong>${requestData.date}</strong> has been <strong style="color: ${statusColor};">${statusText}</strong>.</p>
      <ul>
        <li><strong>Original Time In:</strong> ${requestData.time_in || '-'}</li>
        <li><strong>Original Time Out:</strong> ${requestData.time_out || '-'}</li>
      </ul>
      ${commentHtml}
      <p>If you have any questions, please contact the HR department.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Employee decision email sent to ${employeeEmail}`);
  } catch (error) {
    console.error('Failed to send employee decision email:', error);
  }
};

export {
  sendHRAttentionEmail,
  sendEmployeeDecisionEmail
};
