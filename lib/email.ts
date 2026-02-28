import { ImapFlow, type MessageAddressObject } from "imapflow";
import { EmailModel } from "@/models/Email";

export async function createImapClient(account: {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}) {
  const client = new ImapFlow({
    host: account.host,
    port: account.port,
    secure: account.secure,
    auth: {
      user: account.user,
      pass: account.pass,
    },
  });

  await client.connect();
  return client;
}

export async function saveEmail(emailData: {
  accountId: unknown;
  messageId: string;
  subject: string;
  from: MessageAddressObject[];
  date: Date;
  seen: boolean;
  uid: number;
}) {
  const fromAddresses = emailData.from
    .filter((addr) => !!addr.address)
    .map((addr) => ({
      name: addr.name,
      address: addr.address!,
    }));

  const email = await EmailModel.findOneAndUpdate(
    {
      accountId: emailData.accountId,
      messageId: emailData.messageId,
    },
    {
      subject: emailData.subject,
      from: fromAddresses,
      date: emailData.date,
      seen: emailData.seen,
      uid: emailData.uid,
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  return email;
}
