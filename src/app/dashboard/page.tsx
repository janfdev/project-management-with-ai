import { redirect } from "next/navigation";

// Since we have moved the dashboard logic to specific roles (e.g., /dashboard/employee),
// this main page can redirect to the appropriate dashboard based on user role.
// For now, we default to employee dashboard.

export default function Page() {
  redirect("/dashboard/employee");
}
