import { api, getAccessToken } from "./api-client";

export type CurrentUser = {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  phone: string | null;
  is_active: boolean;
  role: "member" | "coach" | "admin";
  created_at: string;
  updated_at: string;
};

export function clearTokens(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

/** Returns null for logged-out visitors instead of throwing — callers
 * shouldn't have to special-case the "no token" path. */
export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    return await api.get<CurrentUser>("/users/me");
  } catch {
    return null;
  }
}