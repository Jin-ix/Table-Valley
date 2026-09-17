import Sidebar from "@/components/Sidebar";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { CommandPalette } from "@/components/CommandPalette";
import { PageTransition } from "@/components/PageTransition";
import { ToastProvider } from "@/contexts/ToastContext";
import { getSession } from "@/lib/auth";
import styles from "../layout.module.css";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const userName = session?.name ?? 'Admin';
  const userRole = session?.role ?? 'ADMIN';

  return (
    <ToastProvider>
      <div className={styles.layout}>
        <AnimatedBackground />
        <CommandPalette />
        <div className="print-hidden">
          <Sidebar userName={userName} userRole={userRole} />
        </div>
        <main className={styles.main}>
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>
    </ToastProvider>
  );
}
