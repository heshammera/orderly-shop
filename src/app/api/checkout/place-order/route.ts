import { NextRequest } from 'next/server';
import { submitOrder } from '@/lib/checkout-server';
export async function POST(request: NextRequest) {return submitOrder(request,false);}
