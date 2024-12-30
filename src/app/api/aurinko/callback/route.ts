// api/aurinko/callback

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const GET = async(req: Request)=>{
    
    const {userId} = auth();

    console.log('User id is',userId);
    return NextResponse.json({message:'Hello World'});
}