import { apiRequest } from "../../services/api";

import type { DiscoveryRoleAggregate, DiscoveryRoleUser } from "./types";

type SearchRolesResponse = {
  message: string;
  data: DiscoveryRoleAggregate[];
};

type RoleDetailResponse = {
  message: string;
  data: { role: string; users: DiscoveryRoleUser[] };
};

export function searchRoles(query?: string, domain?: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (domain) params.set("domain", domain);
  const qs = params.toString();

  return apiRequest<SearchRolesResponse>(`/discovery/roles${qs ? `?${qs}` : ""}`, {
    method: "GET",
    credentials: "include"
  });
}

export function getRoleDetail(roleName: string) {
  return apiRequest<RoleDetailResponse>(`/discovery/roles/${encodeURIComponent(roleName)}`, {
    method: "GET",
    credentials: "include"
  });
}
