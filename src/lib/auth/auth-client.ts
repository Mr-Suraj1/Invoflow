import { createAuthClient } from "better-auth/react"

const baseURL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const { signIn, signUp, useSession, signOut, forgetPassword, resetPassword } = createAuthClient({
  baseURL
});