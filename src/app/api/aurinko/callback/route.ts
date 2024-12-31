// api/aurinko/callback

import { getAccountDetails, getAurinkoAuthToken } from "@/lib/aurinko";
import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export const GET = async(req: NextRequest)=>{
    
    const {userId} = await auth();

    if(!userId) return  NextResponse.json({message:'Unauthorized',status:401});
    const params = req.nextUrl.searchParams;
    const status = params.get('status');
    console.log(status);
    if(status != 'success'){
        return NextResponse.json({message:'Failed to Link Account',status:400});
    }

    const code = params.get('code');
    if(!code){
         return NextResponse.json({message:'No code available',status:400});
    }
    const token = await getAurinkoAuthToken(code);
    
    if(!token){
        return NextResponse.json({message:'Failed to get token',status:400});
    }
    const accoutDetails = await getAccountDetails(token.accessToken);
    console.log(accoutDetails);

    await db.account.upsert({
        where:{
            id:token.accountId
        },
        update:{
            accessToken:token.accessToken
        },
        create:{
            id:token.accountId.toString,
            userId,
            email:accoutDetails.email,
            name:accoutDetails.name,
            accessToken:token.accessToken
        }
    })
    return NextResponse.redirect(new URL('/mail',req.url));

}