import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import ClientsPage from "@/components/clients/clients-page";

export default async function Page() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    
    if (!session) {
        return <div>Not authenticated</div>;
    }
    
    return <ClientsPage />;
} 