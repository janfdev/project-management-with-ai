
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = session?.user.role;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome Back, {session?.user.name}</h1>
      
      {role === 'hr' && (
        <div className="p-6 border rounded-lg bg-card">
            <h2 className="text-xl font-semibold mb-4">HR Quick Actions</h2>
            <p className="text-muted-foreground mb-4">Anda memiliki akses User Management.</p>
            {/* Link to user management page (to be built) */}
            <div className="p-4 bg-muted rounded">
                Gunakan API <code>GET /api/users</code> untuk melihat list user pending.
            </div>
        </div>
      )}

      {role === 'pm' && (
        <div className="p-6 border rounded-lg bg-card">
            <h2 className="text-xl font-semibold mb-4">Project Management</h2>
             <p className="text-muted-foreground">Kelola Project dan Task tim Anda.</p>
        </div>
      )}

      {role === 'employee' && (
        <div className="p-6 border rounded-lg bg-card">
            <h2 className="text-xl font-semibold mb-4">My Tasks</h2>
            <p className="text-muted-foreground">Cek tugas yang diberikan PM.</p>
        </div>
      )}
    </div>
  );
}
