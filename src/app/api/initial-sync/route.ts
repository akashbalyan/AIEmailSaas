// /api/initial-sync

import { Account } from "@/lib/account";
import { syncEmailsToDatabase } from "@/lib/sync-to-db";
import { db } from "@/server/db";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { useId } from "react";

export const POST = async (req:NextRequest)=>{
    const { accountId, userId} = await req.json();
    if(!accountId || !userId) return NextResponse.json({message:'Missing accountId or userId',status:400});

    const dbAccount  = await db.account.findUnique({
        where:{
            id:accountId,
            userId
        }
    });
    
    if(!dbAccount) return NextResponse.json({message:'Account Not Found',status:404});
    
    const account = new Account(dbAccount.accessToken);
    const response = await account.performInitialSync()

    if(!response) return NextResponse.json({message:'Failed to perform initial sync',status:500});
    const { emails, deltaToken } = response;

    //console.log(emails);
    console.log("Delta Token - ",deltaToken);
    await db.account.update({
        where:{
            id:accountId
        },
        data:{
            nextDeltaToken:deltaToken
        }
    });

    await syncEmailsToDatabase(emails,accountId)
    console.log('Sync completed, Delta Token - ',deltaToken);

    return NextResponse.json({success:true,staus:200});
    
}