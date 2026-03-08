import * as OTPAuth from "otpauth";
import { connectDB } from "./mongodb";
import { encryptPassword, decryptPassword } from "./safe-email-password";
import {
  AuthenticatorAccount,
  type ILeanAuthenticatorAccount,
  type TotpAlgorithm,
} from "@/models/AuthenticatorAccount";

interface ParsedOtpUri {
  label: string;
  issuer: string;
  accountName: string;
  secret: string;
  algorithm: TotpAlgorithm;
  digits: number;
  period: number;
}

function toLean(
  doc: Record<string, unknown> & { _id: { toString(): string } },
): Omit<ILeanAuthenticatorAccount, "secret"> {
  const { secret: _secret, ...rest } = doc;
  return {
    ...rest,
    _id: doc._id.toString(),
  } as Omit<ILeanAuthenticatorAccount, "secret">;
}

export function parseOtpAuthUri(uri: string): ParsedOtpUri {
  const parsed = OTPAuth.URI.parse(uri);

  if (!(parsed instanceof OTPAuth.TOTP)) {
    throw new Error("Only TOTP URIs are supported");
  }

  const labelParts = parsed.label.split(":");
  const accountName =
    labelParts.length > 1 ? labelParts.slice(1).join(":").trim() : parsed.label;

  return {
    label: parsed.issuer || parsed.label.split(":")[0].trim(),
    issuer: parsed.issuer,
    accountName,
    secret: parsed.secret.base32,
    algorithm: (parsed.algorithm || "SHA1") as TotpAlgorithm,
    digits: parsed.digits || 6,
    period: parsed.period || 30,
  };
}

export async function getAllAccounts(): Promise<
  Omit<ILeanAuthenticatorAccount, "secret">[]
> {
  await connectDB();
  const accounts = await AuthenticatorAccount.find()
    .sort({ createdAt: -1 })
    .lean();
  return accounts.map((a) => toLean(a as Record<string, unknown> & { _id: { toString(): string } }));
}

export async function createAccount(data: {
  label: string;
  issuer: string;
  accountName: string;
  secret: string;
  algorithm?: TotpAlgorithm;
  digits?: number;
  period?: number;
}): Promise<Omit<ILeanAuthenticatorAccount, "secret">> {
  await connectDB();
  const encrypted = encryptPassword(data.secret);
  const account = await AuthenticatorAccount.create({
    label: data.label,
    issuer: data.issuer,
    accountName: data.accountName,
    secret: encrypted,
    algorithm: data.algorithm ?? "SHA1",
    digits: data.digits ?? 6,
    period: data.period ?? 30,
  });
  return toLean(account.toObject());
}

export async function importAccounts(
  uris: string[],
): Promise<{
  imported: Omit<ILeanAuthenticatorAccount, "secret">[];
  errors: { uri: string; error: string }[];
}> {
  const imported: Omit<ILeanAuthenticatorAccount, "secret">[] = [];
  const errors: { uri: string; error: string }[] = [];

  for (const uri of uris) {
    try {
      const parsed = parseOtpAuthUri(uri.trim());
      const account = await createAccount(parsed);
      imported.push(account);
    } catch (error) {
      errors.push({
        uri: uri.substring(0, 80),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return { imported, errors };
}

export async function generateCodes(): Promise<
  {
    _id: string;
    code: string;
    period: number;
    remaining: number;
  }[]
> {
  await connectDB();
  const accounts = await AuthenticatorAccount.find().lean();
  const now = Date.now();

  return accounts.map((account) => {
    const decryptedSecret = decryptPassword(
      account.secret.ciphertext,
      account.secret.iv,
      account.secret.authTag,
    );

    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(decryptedSecret),
      algorithm: account.algorithm,
      digits: account.digits,
      period: account.period,
    });

    const code = totp.generate();
    const elapsed = Math.floor(now / 1000) % account.period;
    const remaining = account.period - elapsed;

    return {
      _id: account._id.toString(),
      code,
      period: account.period,
      remaining,
    };
  });
}

export async function updateAccount(
  id: string,
  data: Partial<{ label: string; issuer: string; accountName: string }>,
): Promise<Omit<ILeanAuthenticatorAccount, "secret"> | null> {
  await connectDB();
  const account = await AuthenticatorAccount.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).lean();
  if (!account) return null;
  return toLean(account as Record<string, unknown> & { _id: { toString(): string } });
}

export async function deleteAccount(id: string): Promise<boolean> {
  await connectDB();
  const result = await AuthenticatorAccount.findByIdAndDelete(id);
  return !!result;
}
