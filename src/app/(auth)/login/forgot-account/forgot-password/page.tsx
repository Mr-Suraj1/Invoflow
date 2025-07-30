"use client"

import { Suspense } from "react";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { forgetPassword } from "@/lib/auth/auth-client";
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState } from "react";

function ForgotPasswordPageContent() {
    const params = useSearchParams();
    const emailFromQuery = params.get('email') || " ";
    const [email, setEmail] = useState(emailFromQuery);
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error} = await forgetPassword ({
            email,
            redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/login/forgot-account/forgot-password/reset-password?email=${email}`
        })

        if (error) {
            setMessage("Something went wrong. Please try again.");
        } else {
            setMessage("Check your email for the reset link.");
        }
        setEmail("");
    }
     return(        
     <form 
        onSubmit={handleSubmit}
        className="p-6 max-w-md mx-auto space-y-6 container"
    >
        <h1 className="text-xl font-bold">Forgot Password</h1>
        <Input 
        type="email" 
        required
        value={email}
        placeholder="Your Email" 
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border p-2"
        />
        <div className="grid grid-cols-3 gap-2">
            <Button type="submit" >Send Reset Link</Button>
            <Button asChild variant={"outline"}>
                <Link href="/login">Login</Link>
            </Button>
        </div>
    {message && <p>{message}</p>}
</form>
    )
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={
            <div className="p-6 max-w-md mx-auto space-y-6 container">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        }>
            <ForgotPasswordPageContent />
        </Suspense>
    );
}