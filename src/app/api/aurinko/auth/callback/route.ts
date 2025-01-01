// /api/aurinko/auth/callback

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    //console.log('**** Request ***', req);

    // Authenticate the user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Extract query parameters from the incoming request
    const params = req.nextUrl.searchParams;
    const code = params.get('code');
    const state = params.get('state');
    const scope = params.get('scope');

    console.log('Params', { code, state, scope });

    // Validate required parameters
    if (!code || !state || !scope) {
      return NextResponse.json({ message: 'Missing required parameters' }, { status: 400 });
    }

    // Construct the redirect URL
    const aurinkoUrl = new URL('https://api.aurinko.io/v1/auth/callback');
    aurinkoUrl.searchParams.append('code', code);
    aurinkoUrl.searchParams.append('state', state);
    aurinkoUrl.searchParams.append('scope', scope);

    // Redirect the user to Aurinko's URL
    return NextResponse.redirect(aurinkoUrl.toString());
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
};
