import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { HomeContent } from "./_components/home-content";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/checkin");
  }

  return <HomeContent />;
}
