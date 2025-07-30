'use client'

import { Suspense } from 'react';
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { resetPassword } from '@/lib/auth/auth-client';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react'

function ResetPasswordPageContent() {
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const router = useRouter();

    
    useEffect(() => {
        if (!token) {
            setMessage("Invalid or expired token.");
        }
    }, [token]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        
        const { error } = await resetPassword({
            token,
            newPassword: password,
        })

        if (error) {
            setMessage("Failed to reset password.");
        } else {
            setMessage("Password reset successfully. Please login.");
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        }
    }

  return (
    <form 
    onSubmit={handleSubmit}
    className="p-6 max-w-md mx-auto space-y-4 container"
    >
        <h1 className="text-xl font-bold">Reset Password</h1>
        {message && <p>{message}</p>}
        <Input
        type="password" 
        required
        value={password}
        placeholder="New Password"
        onChange={(e) => setPassword(e.target.value)}
        className="w-full border p-2"
        />
        <Button type="submit">Reset Password</Button>
    </form>
  )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="p-6 max-w-md mx-auto space-y-4 container">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        }>
            <ResetPasswordPageContent />
        </Suspense>
    );
}
