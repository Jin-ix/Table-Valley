import { prisma } from '@/lib/prisma';
import SettingsClient from './SettingsClient';
import styles from '../shared.module.css';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const initialSettings = await prisma.settings.findFirst();

  return (
    <div className={styles.page}>
      <SettingsClient initialSettings={initialSettings} />
    </div>
  );
}
