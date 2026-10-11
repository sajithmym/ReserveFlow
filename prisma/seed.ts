import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { z } from "zod";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL,
  }),
});
const credentials = z
  .object({
    SEED_ADMIN_EMAIL: z.email(),
    SEED_ADMIN_PASSWORD: z.string().min(12).max(128),
    SEED_MEMBER_EMAIL: z.email(),
    SEED_MEMBER_PASSWORD: z.string().min(12).max(128),
  })
  .parse(process.env);
if (credentials.SEED_ADMIN_EMAIL === credentials.SEED_MEMBER_EMAIL)
  throw new Error("Seed accounts must have different emails.");
const seeds = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "The Boardroom",
    category: "Meeting room",
    location: "Level 2 · East wing",
    capacity: 12,
    description:
      "A quiet space for bigger ideas. Equipped with a large display, whiteboard, and video conferencing.",
    isActive: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "Focus Room",
    category: "Meeting room",
    location: "Level 1 · North wing",
    capacity: 4,
    description:
      "A private room for small team discussions, interviews, and focused collaboration.",
    isActive: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    name: "Creative Studio",
    category: "Workspace",
    location: "Level 2 · West wing",
    capacity: 8,
    description:
      "An open, flexible workspace with a project wall and room to workshop your next idea.",
    isActive: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    name: "Portable Projector",
    category: "Equipment",
    location: "IT desk · Level 1",
    capacity: null,
    description: "Portable HD projector with HDMI adapter. Collect and return at the IT desk.",
    isActive: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000005",
    name: "Workshop Space",
    category: "Workspace",
    location: "Ground floor",
    capacity: 20,
    description: "A spacious area for hands-on workshops, team sessions, and learning together.",
    isActive: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000006",
    name: "Company Vehicle",
    category: "Vehicle",
    location: "Main parking · Bay 3",
    capacity: 5,
    description: "Shared vehicle for work-related travel. Currently unavailable for maintenance.",
    isActive: false,
  },
] as const;
try {
  const admin = await provision(
    credentials.SEED_ADMIN_EMAIL,
    credentials.SEED_ADMIN_PASSWORD,
    "Alex Morgan",
    "ADMIN",
  );
  const member = await provision(
    credentials.SEED_MEMBER_EMAIL,
    credentials.SEED_MEMBER_PASSWORD,
    "Sam Perera",
    "MEMBER",
  );
  for (const resource of seeds)
    await db.resource.upsert({ where: { id: resource.id }, create: resource, update: {} });
  const tomorrow = new Date(Date.now() + 86400000);
  const day = formatInTimeZone(tomorrow, "Asia/Colombo", "yyyy-MM-dd");
  const bookings = [
    {
      id: "00000000-0000-4000-8000-000000000011",
      resourceId: seeds[0].id,
      userId: member.id,
      title: "Product planning session",
      start: "09:00",
      end: "10:00",
    },
    {
      id: "00000000-0000-4000-8000-000000000012",
      resourceId: seeds[1].id,
      userId: admin.id,
      title: "Design review",
      start: "10:30",
      end: "11:30",
    },
    {
      id: "00000000-0000-4000-8000-000000000013",
      resourceId: seeds[2].id,
      userId: member.id,
      title: "Team workshop",
      start: "14:00",
      end: "16:00",
    },
  ];
  for (const { start, end, ...booking } of bookings) {
    if (await db.reservation.findUnique({ where: { id: booking.id } })) continue;
    const startAt = fromZonedTime(`${day}T${start}`, "Asia/Colombo");
    const endAt = fromZonedTime(`${day}T${end}`, "Asia/Colombo");
    // Keep a rerun safe even after a user has booked this demonstration interval.
    if (
      await db.reservation.findFirst({
        where: {
          resourceId: booking.resourceId,
          status: "CONFIRMED",
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        },
      })
    )
      continue;
    await db.reservation.create({ data: { ...booking, startAt, endAt } });
  }
  console.log(
    "Seed complete: two environment-provisioned accounts, six resources, and non-overlapping reservations. Credentials were not printed.",
  );
} finally {
  await db.$disconnect();
}
async function provision(email: string, password: string, name: string, role: "ADMIN" | "MEMBER") {
  const user = await db.user.upsert({
    where: { email: email.toLowerCase() },
    create: { email: email.toLowerCase(), name, role, emailVerified: true },
    update: {},
  });
  await db.account.upsert({
    where: { providerId_accountId: { providerId: "credential", accountId: user.id } },
    create: {
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: await hashPassword(password),
    },
    update: {},
  });
  return user;
}
