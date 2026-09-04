"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import Sidebar from "./Sidebar";

const PUBLIC_ROUTES = ["/login", "/register"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { canAccess } = useStore();
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (!user && !isPublic) router.replace("/login");
    if (user && isPublic) router.replace("/");
    // A role that cannot open this screen is sent back to the register.
    if (user && !isPublic && !canAccess(user.role, pathname)) router.replace("/");
  }, [user, isPublic, pathname, router, canAccess]);

  if (isPublic) return <>{children}</>;
  if (!user) return <div className="h-dvh bg-white" />;

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-hidden bg-white">{children}</main>
    </div>
  );
}
