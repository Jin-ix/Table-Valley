import { prisma } from '@/lib/prisma';
import StaffClient from './StaffClient';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  const staff = await prisma.staff.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // Map Prisma Staff model to the StaffMember interface expected by StaffClient
  const mappedStaff = staff.map(s => ({
    id: s.id,
    name: s.name,
    role: s.role,
    email: s.email || '',
    phone: s.phone || '',
    shift: s.shift,
    status: s.status,
    salary: s.baseSalary,
    bonus: s.defaultBonus,
    joined: format(new Date(s.joinedDate), 'MMM yyyy'),
    hoursThisWeek: 40, // Mocked for now until Attendance is fully wired
    ordersToday: 0     // Mocked for now until Orders relation is wired
  }));

  return <StaffClient initialStaff={mappedStaff} />;
}
