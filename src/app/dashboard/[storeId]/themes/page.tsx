import ThemeGallery from '@/components/theme-studio/ThemeGallery';
export default function Page({params}:{params:{storeId:string}}){return <ThemeGallery storeId={params.storeId}/>;}
