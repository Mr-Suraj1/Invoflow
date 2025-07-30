import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import Link from "next/link";


export default function Layout({
    children
}: Readonly<{
    children : React.ReactNode;
}>) {
    return (
        <div>
            <Button className="fixed left-4 top-4" variant="outline" asChild>
                <Link href="/">
                    <Icon.ArrowLeft  className="h-2 w-2"/>
                </Link>
            </Button>
            {children}
        </div>
    )
}
