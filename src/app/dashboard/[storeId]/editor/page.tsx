import StudioEditor from '@/components/theme-studio/StudioEditor';
export default function Page({params}:{params:{storeId:string}}){return <StudioEditor storeId={params.storeId}/>;}
