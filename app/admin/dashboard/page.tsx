import { forbidden } from "next/navigation";
import { getAdminSession } from "@/lib/require-admin";

export default async function Page() {
  const session = await getAdminSession();

  if (!session) {
    forbidden();
  }

  return <div></div>;
}
