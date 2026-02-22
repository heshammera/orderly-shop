import { CopyrightRequests } from '@/components/admin/CopyrightRequests';

export const metadata = {
    title: 'Copyright Removal Requests - Admin',
    description: 'Manage store requests to remove the Powered by Orderly footer copyright',
};

export default function CopyrightRequestsPage() {
    return (
        <div className="max-w-7xl mx-auto">
            <CopyrightRequests />
        </div>
    );
}
