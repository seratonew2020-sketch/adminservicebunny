import { defineStore } from "pinia";
import { ref } from "vue";

export const useReportStore = defineStore("report", () => {
  const reports = ref([]);
  const loading = ref(false);

  // Mock Data logic for now
  const fetchReports = async () => {
    loading.value = true;
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    reports.value = [
      {
        id: "RPT-001",
        name: "Annual Tax Summary 2023",
        type: "Financial",
        date: "2023-10-20",
        author: "Sarah Jenkins",
        status: "Completed",
        size: "2.4 MB",
      },
      {
        id: "RPT-002",
        name: "Q3 Performance Audit",
        type: "HR",
        date: "2023-10-18",
        author: "Marcus Thompson",
        status: "Completed",
        size: "1.1 MB",
      },
      {
        id: "RPT-003",
        name: "Safety Compliance Check",
        type: "Operations",
        date: "2023-10-15",
        author: "Elena Rodriguez",
        status: "Archived",
        size: "856 KB",
      },
      {
        id: "RPT-004",
        name: "Payroll Adjustments Oct",
        type: "Financial",
        date: "2023-10-12",
        author: "Sarah Jenkins",
        status: "Pending",
        size: "-",
      },
      {
        id: "RPT-005",
        name: "IT Equipment Inventory",
        type: "Inventory",
        date: "2023-10-10",
        author: "System Admin",
        status: "Completed",
        size: "3.2 MB",
      },
      {
        id: "RPT-006",
        name: "Employee Overtime Log",
        type: "HR",
        date: "2023-10-09",
        author: "Marcus Thompson",
        status: "Completed",
        size: "540 KB",
      },
      {
        id: "RPT-007",
        name: "Server Uptime Report",
        type: "Operations",
        date: "2023-10-08",
        author: "System Bot",
        status: "Completed",
        size: "120 KB",
      },
    ];
    loading.value = false;
  };

  return {
    reports,
    loading,
    fetchReports,
  };
});
