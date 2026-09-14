import type {Metadata} from 'next';
import {InformationPage} from '@/components/landing/InformationPage';
export const metadata:Metadata={title:'سياسة الخصوصية | Orderly',alternates:{canonical:'https://orderlyshops.com/privacy'}};
export default function Page(){return <InformationPage kind="privacy"/>}
