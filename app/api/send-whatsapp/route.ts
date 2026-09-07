import {eq} from "drizzle-orm";
import {ensureDb,getDb} from "../../../db";
import {cartSnapshots} from "../../../db/schema";
import {sendCartWhatsApp} from "../../../lib/whatsapp";

export async function POST(request:Request){try{await ensureDb();const{userId,removeCoupon=false}=await request.json() as{userId?:string;removeCoupon?:boolean};if(!userId)return Response.json({error:"userId required"},{status:400});const db=getDb();const[cart]=await db.select().from(cartSnapshots).where(eq(cartSnapshots.userId,userId)).limit(1);if(!cart)return Response.json({error:"cart not found"},{status:404});const sent=await sendCartWhatsApp(cart,{removeCoupon});await db.update(cartSnapshots).set({status:"sent",updatedAt:new Date().toISOString()}).where(eq(cartSnapshots.userId,userId));return Response.json({sent:true,...sent});}catch(error){console.error("WhatsApp send failed",error);return Response.json({error:error instanceof Error?error.message:"Unable to send WhatsApp message"},{status:500})}}
