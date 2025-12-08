import { getServerSession } from "@/lib/get-server-session";
import { RegisterForm } from "./register-form";
import { redirect } from "next/navigation";
import { ForbiddenError } from "@/lib/utils";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ secret: string }>;
}) {
  const session = await getServerSession();
  if (session) {
    redirect("/");
  }
  const { secret } = await searchParams;
  if (secret !== process.env.ADMIN_SECRET) {
    throw new ForbiddenError("Forbidden");
  }

  return (
    <main className="w-full flex flex-col items-center">
      <section className="w-full mx-auto max-w-5xl">
        <h1 className="sm:text-5xl text-4xl font-calistoga font-bold text-center">
          create an account.
        </h1>
        <RegisterForm />
      </section>
    </main>
  );
}
