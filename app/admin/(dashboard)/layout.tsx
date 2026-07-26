import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "@/components/admin/AdminNav";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defensa en profundidad: el middleware ya protege /admin/*, esto evita
  // además un flash de contenido si alguna vez se relaja el matcher.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
      <aside className="w-full md:w-60 md:shrink-0 border-b md:border-b-0 md:border-r border-border p-4 flex flex-col gap-4 md:gap-6">
        <div className="flex items-center justify-between md:block">
          <div>
            <p className="font-semibold">LUMO</p>
            <p className="text-xs text-foreground-muted">Backoffice</p>
          </div>
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>
        <div className="overflow-x-auto md:overflow-visible">
          <AdminNav />
        </div>
        <div className="hidden md:flex mt-auto flex-col gap-3">
          <ThemeToggle />
          <p className="text-xs text-foreground-muted truncate">{user.email}</p>
          <LogoutButton />
        </div>
        <div className="flex md:hidden items-center justify-between">
          <p className="text-xs text-foreground-muted truncate">{user.email}</p>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  );
}
