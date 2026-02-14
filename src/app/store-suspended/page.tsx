import { StatusPage } from '@/components/store-status/StatusPage';

export default async function StoreSuspendedPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const reason = searchParams.reason as string;
    const type = (searchParams.type as string || 'banned') as 'unpaid' | 'maintenance' | 'banned';

    return <StatusPage type={type} isAdminView={true} reason={reason} />;
}
