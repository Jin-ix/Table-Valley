'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function updateSettings(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return { error: 'Unauthorized' };
  }

  // Parse fields
  const data = {
    restaurantName: formData.get('restaurantName') as string,
    phone: formData.get('phone') as string,
    address: formData.get('address') as string,
    gstin: formData.get('gstin') as string,
    fssaiLicense: formData.get('fssaiLicense') as string,
    taxRate: parseFloat(formData.get('taxRate') as string) || 0,
    serviceCharge: parseFloat(formData.get('serviceCharge') as string) || 0,
    currencySymbol: formData.get('currencySymbol') as string,
    autoPrintKot: formData.get('autoPrintKot') === 'on',
    autoPrintBill: formData.get('autoPrintBill') === 'on',
    soundNotifications: formData.get('soundNotifications') === 'on',
    darkModeSidebar: formData.get('darkModeSidebar') === 'on',
    showItemImages: formData.get('showItemImages') === 'on',
  };

  try {
    const existing = await prisma.settings.findFirst();
    if (existing) {
      await prisma.settings.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.settings.create({
        data,
      });
    }

    revalidatePath('/settings');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to update settings' };
  }
}
