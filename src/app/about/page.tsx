import type {Metadata} from 'next';
import {InformationPage} from '@/components/landing/InformationPage';
export const metadata:Metadata={title:'عن أوردرلي | Orderly',alternates:{canonical:'https://orderlyshops.com/about'}};
export default function Page(){return <InformationPage kind="about"/>}
