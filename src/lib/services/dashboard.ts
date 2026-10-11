import "server-only";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { dayBounds } from "@/lib/time";

export async function getDashboard() {
  const user = await requireUser();
  const now = new Date();
  const { start, end } = dayBounds(now);
  const scope = user.role === "MEMBER" ? { userId: user.id } : {};
  const [
    activeResources,
    todayBookings,
    upcomingCount,
    cancelledCount,
    upcoming,
    categories,
    availableNow,
  ] = await Promise.all([
    db.resource.count({ where: { isActive: true } }),
    db.reservation.count({
      where: { ...scope, status: "CONFIRMED", startAt: { lt: end }, endAt: { gt: start } },
    }),
    db.reservation.count({ where: { ...scope, status: "CONFIRMED", startAt: { gt: now } } }),
    db.reservation.count({ where: { ...scope, status: "CANCELLED" } }),
    db.reservation.findMany({
      where: { ...scope, status: "CONFIRMED", endAt: { gt: now } },
      orderBy: { startAt: "asc" },
      take: 5,
      include: { resource: true, user: { select: { name: true } } },
    }),
    db.resource.groupBy({
      by: ["category"],
      where: { isActive: true },
      _count: true,
      orderBy: { category: "asc" },
    }),
    db.resource.count({
      where: {
        isActive: true,
        reservations: { none: { status: "CONFIRMED", startAt: { lte: now }, endAt: { gt: now } } },
      },
    }),
  ]);
  return {
    user,
    now,
    activeResources,
    todayBookings,
    upcomingCount,
    cancelledCount,
    upcoming,
    categories,
    availableNow,
  };
}
