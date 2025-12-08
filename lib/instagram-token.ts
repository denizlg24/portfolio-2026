import InstagramToken, {IInstagramToken} from '@/models/InstagramToken';
import { connectDB } from '@/lib/mongodb';

export async function getInstagramToken(): Promise<IInstagramToken | null> {
  await connectDB();
  const token = await InstagramToken.findOne().sort({ createdAt: -1 });
  return token;
}

export async function saveInstagramToken(accessToken: string, expiresIn: number): Promise<IInstagramToken> {
  await connectDB();
  await InstagramToken.deleteMany({});
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  const token = new InstagramToken({ accessToken, expiresAt });
  await token.save();
  return token;
}

export async function deleteInstagramToken(id: string): Promise<void> {
  await connectDB();
  await InstagramToken.findByIdAndDelete(id);
}