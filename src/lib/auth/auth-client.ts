import { createAuthClient } from "better-auth/react"

// More robust baseURL detection
const getBaseURL = () => {
  // Client-side: use window.location.origin
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  
  // Server-side: check environment variables
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  
  // Fallback for Vercel
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Development fallback
  return "http://localhost:3000";
};

const baseURL = getBaseURL();

// Debug logging
if (typeof window === "undefined") {
  console.log("Server-side baseURL:", baseURL);
  console.log("NEXT_PUBLIC_BASE_URL:", process.env.NEXT_PUBLIC_BASE_URL);
  console.log("VERCEL_URL:", process.env.VERCEL_URL);
}

export const { signIn, signUp, useSession, signOut, forgetPassword, resetPassword } = createAuthClient({
  baseURL
});