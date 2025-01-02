// api/aurinko/callback

import { waitUntil } from "@vercel/functions"
import { getAccountDetails, getAurinkoAuthToken } from "@/lib/aurinko";
import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const GET = async(req: NextRequest)=>{
    
    
    const {userId} = await auth();

    if(!userId) return  NextResponse.json({message:'Unauthorized',status:401});

    const params = req.nextUrl.searchParams;
    const status = params.get('status');
    
    //console.log('Final Callback Params',params);

    if(status != 'success')return  NextResponse.json({message:'Status not successful',status:400});

    const code = params.get('code');
    if(!code){
         return NextResponse.json({message:'No code available',status:400});
    }

    const token = await getAurinkoAuthToken(code);
    //console.log('token',token);
    if(!token){
        return NextResponse.json({message:'Failed to get token',status:400});
    }
    const accoutDetails = await getAccountDetails(token.accessToken);
    //console.log('accountDetails',accoutDetails);

    await db.account.upsert({
        where:{
            id:token.accountId.toString()
        },
        create:{
            id:token.accountId.toString(),
            userId,
            emailAddress:accoutDetails.email,
            name:accoutDetails.name,
            accessToken:token.accessToken
        },
        update:{
            accessToken:token.accessToken
        }
        
    });

    // trigger initial sync
    waitUntil(
         axios.post(`${process.env.NEXT_PUBLIC_URL}/api/initial-sync`,{
            accountId:token.accountId.toString(),
            userId
         }).then(res=>{
            console.log('Initial Sync Triggered',res.data);
         }).catch(err=>{
            console.error('Error Triggereing Initial Sync',err);
         })
    )         
    
    return NextResponse.redirect(new URL('/mail',req.url));

}