import type {Metadata} from 'next';
import {DemoStore} from '@/components/landing/DemoStore';
export const metadata:Metadata={title:'جرّب متجر أوردرلي | Orderly demo',robots:{index:false,follow:true},alternates:{canonical:'https://orderlyshops.com/demo'}};
export default function DemoPage({searchParams}:{searchParams:{theme?:string}}){const theme=searchParams.theme==='beauty'?'beauty':searchParams.theme==='studio'?'studio':'everyday';return <DemoStore theme={theme}/>}
