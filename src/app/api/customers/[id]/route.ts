import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';
import { updateCustomer, deleteCustomer } from '@/lib/db/store';

interface RouteProps {
    params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteProps) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const resolvedParams = await params;
    try {
        const body = await request.json();
        const customer = await updateCustomer(resolvedParams.id, body);
        return NextResponse.json({ success: true, data: customer });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: RouteProps) {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const resolvedParams = await params;
    try {
        const success = await deleteCustomer(resolvedParams.id);
        return NextResponse.json({ success });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
    }
}
