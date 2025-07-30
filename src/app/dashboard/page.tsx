import DashboardPage from "@/components/dashboard-page";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";

export default async function Page() {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if(!session) {
        return <div>Not authenticated</div>
    }
    return (
        <DashboardPage />
    )
}