import { saveInstagramToken } from '@/lib/instagram-token';
import { ForbiddenError } from '@/lib/utils';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  const cleanCode = code.replace('#_', '');

  try {
    const shortTokenForm = new FormData();
    shortTokenForm.append('client_id', process.env.INSTAGRAM_APP_ID!);
    shortTokenForm.append('client_secret', process.env.INSTAGRAM_APP_SECRET!);
    shortTokenForm.append('grant_type', 'authorization_code');
    shortTokenForm.append('redirect_uri', process.env.INSTAGRAM_REDIRECT_URI!);
    shortTokenForm.append('code', cleanCode);

    const shortRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      body: shortTokenForm,
    });
    
    const shortData = await shortRes.json();

    if (shortData.error_message || shortData.error) {
      return NextResponse.json({ error: 'Short Token Failed', details: shortData }, { status: 400 });
    }

    const shortToken = shortData.access_token;
    const userId = shortData.user_id;
    if (userId!='denizlg24'){
      throw new ForbiddenError("Forbidden");
    }
    const longUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_APP_SECRET}&access_token=${shortToken}`;
    
    const longRes = await fetch(longUrl);
    const longData = await longRes.json();

    if (longData.error) {
      return NextResponse.json({ error: 'Long Token Failed', details: longData }, { status: 400 });
    }

    await saveInstagramToken(longData.access_token, longData.expires_in);

    return NextResponse.redirect('/admin/dashboard/instagram-tokens');

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}