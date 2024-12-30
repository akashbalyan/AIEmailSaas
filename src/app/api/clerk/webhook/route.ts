// /api/clerk/webhook

import { db } from "@/server/db";


export const POST = async (req:Request) => {
    const {data} = await req.json();

    console.log("Clerk Webhook received", data);
    const User = {
        emailAddress:data.email_addresses[0].email_address,
        id:data.id,
        firstName:data.first_name,
        lastName:data.last_name,
        imageUrl:data.image_url
    };
    await db.user.create({
        data:User
    });
    console.log('User created');
    return new Response(
        "Webhook Received",
        { status : 200}
    )
};