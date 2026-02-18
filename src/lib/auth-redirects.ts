import { redirect } from "next/navigation";

import { auth } from "@/auth";

export async function redirectIfAuthenticated() {
  const session = await auth();
  if (session?.user) {
    redirect("/chat");
  }
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }
  return session;
}
