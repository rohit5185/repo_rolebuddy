import { apiRequest } from "@/services/api";

import type { DashboardResponse } from "./types";

export function getDashboard() {
  return apiRequest<DashboardResponse>("/user/dashboard", {
    method: "GET",
    credentials: "include"
  });
}