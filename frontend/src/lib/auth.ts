import { api } from "./api-client";

export type CurrentUser = {
  id: number;
  email: string;
  full_name: string | null;
  phone: string | null;
  is_active: boolean;
  role: "member" | "coach" | "admin";
  created_at: string;
  updated_at: string;
};

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function clearTokens(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

/** Returns null for logged-out visitors instead of throwing — callers
 * shouldn't have to special-case the "no token" path. */
export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  if (!getAccessToken()) return null;
  try {
    return await api.get<CurrentUser>("/users/me");
  } catch {
    return null;
  }
}