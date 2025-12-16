import type { Metadata } from "next";
import { getAllContacts, getContactCountByStatus } from "@/lib/contacts";
import { ContactsWrapper } from "./contacts-wrapper";

export const metadata: Metadata = {
  title: "Contact Submissions | Admin Dashboard",
  description: "View and manage contact form submissions",
};

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const [contacts, stats] = await Promise.all([
    getAllContacts({ limit: 100 }),
    getContactCountByStatus(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Contact Submissions</h1>
        <p className="text-muted-foreground">
          View and manage contact form submissions
        </p>
      </div>

      <ContactsWrapper
        initialContacts={contacts.map((contact) => ({
          ...contact,
          _id: contact._id.toString(),
        }))}
        initialStats={stats}
      />
    </div>
  );
}
