import {NextResponse} from 'next/server';
export async function POST(){return NextResponse.json({error:'لم يتم تفعيل إرسال رموز التحقق لهذا المتجر بعد؛ يمكنك إكمال الطلب دون استبدال نقاط.'},{status:503});}
