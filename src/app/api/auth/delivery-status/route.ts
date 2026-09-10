import {NextResponse} from 'next/server';
export async function GET(){return NextResponse.json({ready:process.env.AUTH_DELIVERY_ENABLED==='true'}, {headers:{'Cache-Control':'no-store'}});}
