import { supabase } from "../lib/supabase.js";
import nodemailer from "nodemailer";

// Setup Nodemailer Transporter
// Ideally use environment variables for SMTP settings
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || "mock_user", // Replace with real env var
    pass: process.env.SMTP_PASS || "mock_pass",
  },
});

// Mock sending if no real credentials
const isMockEmail = !process.env.SMTP_USER;

export const sendEmail = async (to, subject, html) => {
  if (isMockEmail) {
    console.log(`[Mock Email] To: ${to}, Subject: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Admin Service Bunny" <noreply@bunny.com>',
      to,
      subject,
      html,
    });
    console.log(`[Email Sent] To: ${to}`);
  } catch (error) {
    console.error("[Email Error]", error);
  }
};

export const createNotification = async (userId, title, message, type = "info", link = null) => {
  try {
    // 1. Insert into DB
    const { data, error } = await supabase
      .from("notifications")
      .insert([{ user_id: userId, title, message, type, link }])
      .select()
      .single();

    if (error) throw error;

    // 2. Check Preferences for Email
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("email_enabled")
      .eq("user_id", userId)
      .single();

    // Default to true if no prefs found
    const emailEnabled = prefs ? prefs.email_enabled : true;

    if (emailEnabled) {
      // Fetch user email
      const { data: user } = await supabase
        .from("employees")
        .select("email")
        .eq("user_id", userId)
        .single();

      if (user && user.email) {
        await sendEmail(user.email, title, `<p>${message}</p><p><a href="${process.env.VITE_APP_URL || 'http://localhost:5173'}${link}">View Details</a></p>`);
      }
    }

    return data;
  } catch (err) {
    console.error("Create Notification Error:", err);
    return null;
  }
};

export const notifyAdmins = async (title, message, link = null) => {
  try {
    // Find admins
    // Logic: Role is 'admin' OR Position contains 'Admin'/'Manager'
    const { data: admins, error } = await supabase
      .from("employees")
      .select("user_id, email")
      .or("role.eq.admin,position.ilike.%admin%,position.ilike.%manager%")
      .not("user_id", "is", null);

    if (error) throw error;

    if (!admins || admins.length === 0) {
        console.warn("No admins found to notify");
        return;
    }

    // Notify each admin
    for (const admin of admins) {
      await createNotification(admin.user_id, title, message, "info", link);
    }
  } catch (err) {
    console.error("Notify Admins Error:", err);
  }
};
