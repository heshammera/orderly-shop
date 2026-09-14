import type {Metadata} from 'next';
import {InformationPage} from '@/components/landing/InformationPage';
export const metadata:Metadata={title:'شروط الاستخدام والاسترداد | Orderly',alternates:{canonical:'https://orderlyshops.com/terms'}};
export default function Page(){return <InformationPage kind="terms"/>}
