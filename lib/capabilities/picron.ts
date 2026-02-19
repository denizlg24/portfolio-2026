import { decryptPassword, encryptPassword } from '../safe-email-password';
import type { ICapability } from '@/models/Resource';

export interface EncryptedField {
  ciphertext: string;
  iv: string;
  authTag: string;
}

export interface PiCronConfig {
  username: EncryptedField;
  password: EncryptedField;
}

export function isPiCronCapability(cap: ICapability): boolean {
  return cap.type === 'picron';
}

export function getPiCronCredentials(cap: ICapability): { username: string; password: string } {
  const config = cap.config as unknown as PiCronConfig;
  return {
    username: decryptPassword(config.username.ciphertext, config.username.iv, config.username.authTag),
    password: decryptPassword(config.password.ciphertext, config.password.iv, config.password.authTag),
  };
}

export function buildPiCronConfig(username: string, password: string): Record<string, unknown> {
  return {
    username: encryptPassword(username),
    password: encryptPassword(password),
  };
}
