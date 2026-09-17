'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Package,
  LineChart,
  FileText,
  Settings,
  LogOut,
  Users,
  Warehouse,
  UserCog,
  DoorClosed,
} from 'lucide-react';
import { logout } from '@/app/actions/authActions';
import styles from './Sidebar.module.css';

const NAV_GROUPS = [
  {
    label: 'Operations',
    items: [
      { href: '/pos',          label: 'POS / New Order',  icon: ShoppingCart, badge: 'Live' },
      { href: '/orders',       label: 'Orders',           icon: ClipboardList },
      { href: '/day-closing',  label: 'Day Closing',      icon: DoorClosed },
    ]
  },
  {
    label: 'Management',
    items: [
      { href: '/dashboard',  label: 'Dashboard',       icon: LayoutDashboard },
      { href: '/products',   label: 'Menu & Products', icon: Package },
      { href: '/staff',      label: 'Staff',           icon: Users },
      { href: '/inventory',  label: 'Inventory',       icon: Warehouse },
      { href: '/users',      label: 'Users',           icon: UserCog, adminOnly: true },
    ]
  },
  {
    label: 'Insights',
    items: [
      { href: '/sales',    label: 'Sales',    icon: LineChart },
      { href: '/reports',  label: 'Reports',  icon: FileText },
      { href: '/settings', label: 'Settings', icon: Settings },
    ]
  }
];

export default function Sidebar({
  userName = 'Admin',
  userRole = 'ADMIN',
}: {
  userName?: string;
  userRole?: string;
}) {
  const pathname = usePathname();
  const router   = useRouter();
  const isAdmin  = userRole === 'ADMIN';

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  const initial = userName?.charAt(0)?.toUpperCase() ?? 'A';
  const roleLabel = userRole === 'ADMIN' ? 'Owner · Admin' : 'Cashier';

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandIcon}>TV</div>
        <div className={styles.brandText}>
          <span className={styles.brandName}>Table Valley</span>
          <span className={styles.brandTagline}>Restaurant OS</span>
        </div>
      </div>

      <nav className={styles.nav}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className={styles.navSection}>{group.label}</div>
            {group.items.map((item) => {
              // Hide admin-only items for non-admins
              if ((item as any).adminOnly && !isAdmin) return null;

              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              const isPos    = item.href === '/pos';

              const content = (
                <>
                  <Icon className={styles.icon} size={17} />
                  <span>{item.label}</span>
                  {'badge' in item && item.badge && (
                    <span className={styles.navBadge}>{item.badge}</span>
                  )}
                </>
              );

              if (isPos) {
                return (
                  <a key={item.href} href={item.href}
                    className={`${styles.navItem} ${isActive ? styles.active : ''}`}>
                    {content}
                  </a>
                );
              }

              return (
                <Link key={item.href} href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}>
                  {content}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.user}>
          <div className={styles.avatar}>{initial}</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{userName}</div>
            <div className={styles.userRole}>{roleLabel}</div>
          </div>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
