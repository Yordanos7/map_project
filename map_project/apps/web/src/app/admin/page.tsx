import { auth } from "@map_project/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) redirect("/login");
    return <AdminDashboard />;
}
