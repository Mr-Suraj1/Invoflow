"use client"

import { LogoIcon } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icon } from '@/components/icons'
import Link from 'next/link'
import { signIn } from '@/lib/actions'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import SignInSocial from './sign-in-social'


export default function LoginForm() {
    const initialState = { errorMessage: ""};
    const [state, formAction, pending] = useActionState(signIn, initialState)

    useEffect(() => {
        if (state.errorMessage.length) {
            toast.error(state.errorMessage)
        }
    }, [state.errorMessage])
    return (
        <section className="flex min-h-screen bg-zinc-50 px-4 py-16 md:py-32 dark:bg-transparent">
            <form
                action={formAction}
                className="bg-muted m-auto h-fit w-full max-w-sm overflow-hidden rounded-[calc(var(--radius)+.125rem)] border shadow-md shadow-zinc-950/5 dark:[--color-muted:var(--color-zinc-900)]">
                <div className="bg-card -m-px rounded-[calc(var(--radius)+.125rem)] border p-8 pb-6">
                    <div className="text-center">
                        <Link
                            href="/"
                            aria-label="go home"
                            className="mx-auto block w-fit">
                            <LogoIcon />
                        </Link>
                        <h1 className="mb-1 mt-4 text-xl font-semibold">Sign In to Starter Example.</h1>
                        <p className="text-sm">Welcome back! Sign in to continue</p>
                    </div>

                    <div className="mt-6 space-y-6">
                        <div className="space-y-2">
                            <Label
                                htmlFor="email"
                                className="block text-sm">
                                Email
                            </Label>
                            <Input
                                type="email"
                                required
                                name="email"
                                id="email"
                            />
                        </div>

                        <div className="space-y-0.5">
                            <div className="flex items-center justify-between">
                                <Label
                                    htmlFor="pwd"
                                    className="text-title text-sm">
                                    Password
                                </Label>
                                <Button
                                    asChild
                                    variant="link"
                                    size="sm">
                                    <Link
                                        href="/login/forgot-account"
                                        className="link intent-info variant-ghost text-sm">
                                        Forgot your Account ?
                                    </Link>
                                </Button>
                            </div>
                            <Input
                                type="password"
                                required
                                name="pwd"
                                id="pwd"
                                className="input sz-md variant-mixed"
                            />
                        </div>

                        <Button className="w-full" disabled={pending} aria-disabled={pending}>Sign In</Button>
                    </div>

                    <div className="my-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                        <hr className="border-dashed" />
                        <span className="text-muted-foreground text-xs">Or continue With</span>
                        <hr className="border-dashed" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <SignInSocial
                            provider="google">
                            <Icon.google />
                            <span>Google</span>
                        </SignInSocial>
                        <SignInSocial
                            provider="github">
                            <Icon.github />
                            <span>Github</span>
                        </SignInSocial>
                    </div>
                </div>

                <div className="p-3">
                    <p className="text-accent-foreground text-center text-sm">
                        Don&apos;t have an account ?
                        <Button
                            asChild
                            variant="link"
                            className="px-2">
                            <Link href="/sign-up">Create account</Link>
                        </Button>
                    </p>
                </div>
            </form>
        </section>
    )
}

