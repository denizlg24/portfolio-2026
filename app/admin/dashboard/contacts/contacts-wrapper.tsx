"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ContactsTable } from "./contacts-table";
import { ILeanContact } from "@/models/Contact";

interface ContactsWrapperProps {
  initialContacts: ILeanContact[];
  initialStats: {
    total: number;
    pending: number;
    read: number;
    responded: number;
    archived: number;
  };
}

export function ContactsWrapper({
  initialContacts,
  initialStats,
}: ContactsWrapperProps) {
  const [stats, setStats] = useState(initialStats);

  const handleStatusChange = (oldStatus: string, newStatus: string) => {
    setStats((prev) => ({
      ...prev,
      [oldStatus]: Math.max(0, prev[oldStatus as keyof typeof prev] - 1),
      [newStatus]: prev[newStatus as keyof typeof prev] + 1,
    }));
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Pending</div>
          <div className="text-2xl font-bold">{stats.pending}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Read</div>
          <div className="text-2xl font-bold">{stats.read}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Responded</div>
          <div className="text-2xl font-bold">{stats.responded}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Archived</div>
          <div className="text-2xl font-bold">{stats.archived}</div>
        </Card>
      </div>

      <ContactsTable
        initialContacts={initialContacts}
        onStatusChange={handleStatusChange}
      />
    </>
  );
}
