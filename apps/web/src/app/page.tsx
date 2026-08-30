import { redirect } from "next/navigation";

export default function RootPage() {
  // Middleware catches unauthenticated users before reaching this page,
  // but if reached directly, redirect to /dashboard.
  redirect("/dashboard");
}
