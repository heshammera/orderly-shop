import type {Metadata} from 'next';
import {InformationPage} from '@/components/landing/InformationPage';
export const metadata:Metadata={title:'تواصل معنا | Orderly',alternates:{canonical:'https://orderlyshops.com/contact'}};
export default function Page(){return <InformationPage kind="contact"/>}
