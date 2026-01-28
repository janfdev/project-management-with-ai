
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CircleSlash, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/auth/login");
  }

  // @ts-ignore - status exists in our schema but types might need regeneration
  const status = session.user.status;

  if (status === "pending") {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center p-4">
        <Alert className="max-w-md border-yellow-500/50 bg-yellow-500/10 text-yellow-600">
            <Clock className="h-4 w-4" />
            <AlertTitle>Waiting for Approval</AlertTitle>
            <AlertDescription>
                Akun Anda sedang menunggu verifikasi dari HR. Silakan hubungi admin atau cek kembali nanti.
            </AlertDescription>
        </Alert>
        <div className="mt-4">
             <Link href="/auth/login"><Button variant="outline">Back to Login</Button></Link>
        </div>
      </div>
    );
  }

   if (status === "rejected") {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
            <CircleSlash className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
                Waduh! Akun Anda ditolak oleh HR. Hubungi manajemen jika ini kesalahan.
            </AlertDescription>
        </Alert>
         <div className="mt-4">
             <Link href="/auth/login"><Button variant="outline">Back to Login</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Sidebar/Navbar could go here */}
      <header className="border-b p-4 flex justify-between items-center bg-card">
        <div className="font-bold">Biznovation Dashboard</div>
        <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
                {session.user.name} ({session.user.role})
            </span>
            {/* Logout button would be client component */}
        </div>
      </header>
      <main className="p-8">
        {children}
      </main>
    </div>
  );
}
