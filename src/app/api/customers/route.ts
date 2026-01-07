import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';
import { getCustomers, createCustomer } from '@/lib/db/store';

export async function GET(request: Request) {
    const auth = getAuthFromRequest(request);
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const customers = await getCustomers(search);

    return NextResponse.json({ success: true, data: customers });
}

export async function POST(request: Request) {
    const auth = getAuthFromRequest(request);
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        // Basic validation
        if (!body.name || !body.phone) {
            return NextResponse.json({ error: 'Name and Phone are required' }, { status: 400 });
        }

        const customer = await createCustomer(body);
        return NextResponse.json({ success: true, data: customer });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
    }
}
