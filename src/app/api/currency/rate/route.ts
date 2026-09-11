import { NextRequest,NextResponse } from 'next/server';
import { getUsdRate } from '@/lib/exchange-rates-server';
import { isSupportedCurrency } from '@/lib/currencies';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){
 const currency=req.nextUrl.searchParams.get('currency');
 if(!isSupportedCurrency(currency))return NextResponse.json({error:'عملة غير مدعومة'},{status:400});
 try{return NextResponse.json(await getUsdRate(currency),{headers:{'Cache-Control':'no-store'}});}
 catch(e:any){return NextResponse.json({error:e.message},{status:503});}
}
