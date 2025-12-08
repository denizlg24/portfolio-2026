import { getAdminSession } from "@/lib/require-admin";
import { ForbiddenError } from "@/lib/utils";

export default async function Page() {
  const session = await getAdminSession();
  
  if (!session) {
    throw new ForbiddenError("Forbidden");
  }

  return (
    <div></div>
  );
}
