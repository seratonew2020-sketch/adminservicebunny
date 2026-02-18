import cron from "node-cron";
import { supabase } from "../lib/supabase.js";
import { createNotification, notifyAdmins } from "../services/notificationService.js";
import dayjs from "dayjs";

export const startCronJobs = () => {
  console.log("⏰ Starting Cron Jobs...");

  // 1. Daily Reminder for Upcoming Leaves (Runs at 08:00 AM)
  cron.schedule("0 8 * * *", async () => {
    console.log("Running Daily Leave Reminder Job");
    try {
      const tomorrow = dayjs().add(1, "day").format("YYYY-MM-DD");
      
      const { data: leaves } = await supabase
        .from("leaves")
        .select("*, employees(user_id, first_name)")
        .eq("start_date", tomorrow)
        .eq("status", "approved");

      if (leaves) {
        for (const leave of leaves) {
           if (leave.employees?.user_id) {
             await createNotification(
               leave.employees.user_id,
               "Upcoming Leave Reminder",
               `Reminder: Your leave starts tomorrow (${leave.start_date}).`,
               "info"
             );
           }
        }
      }
    } catch (e) {
      console.error("Cron Job Error (Upcoming Leaves):", e);
    }
  });

  // 2. Reminder for Pending Requests (Runs at 09:00 AM)
  cron.schedule("0 9 * * *", async () => {
    console.log("Running Pending Requests Reminder Job");
    try {
      // Find leaves pending for more than 2 days
      const twoDaysAgo = dayjs().subtract(2, "day").format("YYYY-MM-DD");
      
      const { data: pendingLeaves } = await supabase
        .from("leaves")
        .select("count")
        .eq("status", "pending")
        .lt("created_at", twoDaysAgo); // Assuming created_at exists

      // If there are old pending requests, poke admins
      // (This is a simplified check, ideally check specific counts)
      
      const { count } = await supabase
        .from("leaves")
        .select("*", { count: 'exact', head: true })
        .eq("status", "pending");

      if (count > 0) {
        await notifyAdmins(
          "Pending Leave Requests",
          `There are ${count} pending leave requests waiting for your approval.`,
          "/leaves/approvals"
        );
      }
    } catch (e) {
      console.error("Cron Job Error (Pending Requests):", e);
    }
  });
};
