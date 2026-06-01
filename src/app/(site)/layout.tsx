import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/session";
import { getDb } from "@/lib/db";
import SiteHeader from "@/components/SiteHeader";
import Tracking from "@/components/Tracking";
import ChatWidget from "@/components/ChatWidget";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionFromCookies();
  if (!session) redirect("/start");

  const db = getDb();
  const row = db
    .prepare("SELECT participant_id, cond FROM participants WHERE participant_id = ?")
    .get(session.participantId) as { participant_id: string; cond: string | null } | undefined;
  if (!row?.cond) redirect("/start");

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#f3efe6]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1360px] flex-1 px-4 py-6 md:px-6 md:py-8">{children}</main>
      <Tracking />
      <ChatWidget />
    </div>
  );
}
