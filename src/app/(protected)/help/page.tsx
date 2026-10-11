import { CalendarCheck2, Clock3, ShieldCheck, Users } from "lucide-react";
import { PageHeading } from "@/components/ui/page-heading";
export default function HelpPage() {
  const items = [
    {
      icon: CalendarCheck2,
      title: "Reserve with confidence",
      copy: "Browse resources, choose a future start and end time, and add the purpose of your reservation. Check availability before confirming. Back-to-back reservations are allowed; overlapping ones are prevented.",
    },
    {
      icon: Clock3,
      title: "One shared time zone",
      copy: "Every date and time uses Sri Lanka time, Asia/Colombo (UTC+05:30). Reservations can cross midnight. Your confirmation shows the full start and end dates.",
    },
    {
      icon: Users,
      title: "Plans change",
      copy: "Reschedule a confirmed reservation before it starts. You can cancel before it ends, freeing the slot for others. Cancelled and completed reservations remain in your history. To use a different resource, cancel and create a new reservation.",
    },
    {
      icon: ShieldCheck,
      title: "Clear access for your team",
      copy: "Members manage their own reservations and browse active resources. Administrators manage all resources and reservations. If a resource is deactivated, existing reservations remain confirmed; coordinate with your administrator.",
    },
  ];
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeading
        eyebrow="A little guidance"
        title="Keep your workspace in sync"
        description="Everything you need to find a resource and make a plan."
      />
      <div className="grid gap-5 sm:grid-cols-2">
        {items.map((item) => (
          <article key={item.title} className="rounded-xl border border-stone-200 bg-white p-6">
            <item.icon className="mb-5 text-emerald-700" size={25} strokeWidth={1.5} />
            <h2 className="text-base font-semibold">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-stone-500">{item.copy}</p>
          </article>
        ))}
      </div>
      <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50/60 p-6">
        <h2 className="text-sm font-semibold text-emerald-900">Need account access?</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Contact your workspace administrator for your sign-in credentials. Public registration and
          email password recovery are unavailable in this workspace.
        </p>
      </div>
    </div>
  );
}
