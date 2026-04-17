// app/page.tsx
// Redirect root to dashboard (or login if not authenticated).

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function RootPage() {
  const session = await getSession();
  if (session?.user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
