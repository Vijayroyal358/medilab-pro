import { apiFetch } from "./api";
import { UserLogin, TokenResponse, ForgotPasswordRequest, ResetPasswordRequest } from "../types/index";

export async function loginUser(credentials: UserLogin, labSlug: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>(`/auth/login?lab_slug=${labSlug}`, {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export async function forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string; demo_token?: string }> {
  return apiFetch<{ message: string; demo_token?: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function verifySlug(slug: string): Promise<{ status: string; lab_name: string; lab_slug: string }> {
  return apiFetch<{ status: string; lab_name: string; lab_slug: string }>(`/auth/verify-slug?slug=${slug}`, {
    method: "GET",
  });
}
