import { signIn } from "@/lib/auth/auth-client";
import { Button } from "../ui/button";

export default function SignInSocial({
    provider,children
}:{
    provider:
    | "github"
    | "google"
    | "linkedin"
    | "twitter"
    | "microsoft"
    | "apple"
    | "discord";
    children: React.ReactNode;
}) {
    return <Button onClick={async () => {
        await signIn.social({
            provider,
            callbackURL: '/dashboard'
        }) 
    }}
    type="button"
    variant="outline"
    >
        {children}
    </Button>
}
