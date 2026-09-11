import { NextRequest,NextResponse } from 'next/server';
import { authorizedAdminDb } from '@/lib/admin-session-db';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){
 const db=await authorizedAdminDb();if(!db)return NextResponse.json({error:'جلسة الإدارة غير صالحة'},{status:401});
 const page=Number(req.nextUrl.searchParams.get('page')||1);
 if(!Number.isInteger(page)||page<1)return NextResponse.json({error:'رقم الصفحة غير صالح'},{status:400});
 const {data,error}=await db.rpc('get_all_users_paginated',{p_page:page,p_limit:10,p_search:req.nextUrl.searchParams.get('search')?.slice(0,150)||null,p_status:'all'});
 return NextResponse.json(error?{error:'تعذر تحميل المستخدمين'}:data,{status:error?500:200,headers:{'Cache-Control':'no-store'}});
}
