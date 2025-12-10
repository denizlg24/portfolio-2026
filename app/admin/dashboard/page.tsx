import { getAdminSession } from "@/lib/require-admin";
import { forbidden } from "next/navigation";

export default async function Page() {
  const session = await getAdminSession();
  
  if (!session) {
    forbidden();
  }

  return (
    <div></div>
  );
}
