import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import  db  from "@/db"; // your drizzle instance
import {user, session, account, verification} from "@/db/schema"
import { nextCookies } from "better-auth/next-js";


const schema = {
    user,
    session,
    account,
    verification,
}

export const auth = betterAuth({

    database: drizzleAdapter(db, {
        provider: "pg",
        schema: schema ,// or "mysql", "sqlite"
    }),

    emailAndPassword: {  
        enabled: true,
        autoSignIn: true,
        minPasswordLength: 8,   
        maxPasswordLength: 128,
        sendResetPassword: async ({user, url}) => {
            const { sendEmail } = await import("@/lib/email");
            await sendEmail({
                to: user.email,
                subject: "Password Reset Request",
                html: `
                <p>You requested a password reset.</p>
                <p>Please click the link below to reset your password.</p>
                <a href="${url}">Reset Password</a>
                <hr/>
                <p>If you did not request a password reset, please ignore this email.</p>
                `
            })
        },
        resetPasswordTokenExpiresIn: 3600,// token expires in1 hour
    },
    account: {
        accountLinking: {
            enabled: true,
        },
    },
    socialProviders: { 
        google: { 
           clientId: process.env.GOOGLE_CLIENT_ID as string, 
           clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
        },
        github: { 
           clientId: process.env.GITHUB_CLIENT_ID as string, 
           clientSecret: process.env.GITHUB_CLIENT_SECRET as string, 
        }
    },
   
    plugins: [nextCookies()],
});