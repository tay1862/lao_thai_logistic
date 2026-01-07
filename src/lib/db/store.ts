import {
    CodStatus,
    CreateShipmentDTO,
    DashboardStats,
    Shipment,
    ShipmentDirection,
    ShipmentEvent,
    ShipmentFilters,
    ShipmentStatus,
    TrackingResponse,
    UpdateCodStatusDTO,
    UpdateStatusDTO,
    User,
    Customer,
} from '@/types';
import { prisma } from './prisma';

// ============================================
// User Operations
// ============================================
export async function getUsers(): Promise<Omit<User, 'password'>[]> {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            username: true,
            fullName: true,
            role: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    return users.map(u => ({
        ...u,
        role: u.role as User['role'],
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
    }));
}

export async function getUserByUsername(username: string): Promise<(User & { password: string }) | undefined> {
    const user = await prisma.user.findUnique({
        where: { username },
    });
    if (!user) return undefined;
    return {
        ...user,
        role: user.role as User['role'],
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
    };
}

export async function getUserById(id: string): Promise<User | undefined> {
    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            username: true,
            fullName: true,
            role: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    if (!user) return undefined;
    return {
        ...user,
        role: user.role as User['role'],
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
    };
}

// ============================================
// Shipment Operations
// ============================================
function mapDbShipment(s: any): Shipment {
    return {
        ...s,
        direction: s.direction as ShipmentDirection,
        currentStatus: s.currentStatus as ShipmentStatus,
        parcelType: s.parcelType as Shipment['parcelType'],
        codStatus: s.codStatus as CodStatus,
        lastMileMethod: s.lastMileMethod as Shipment['lastMileMethod'],
        createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
        updatedAt: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : s.updatedAt,
        events: s.events?.map((e: any) => ({
            ...e,
            status: e.status as ShipmentStatus,
            createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : e.createdAt,
        })) || [],
        customer: s.customer ? {
            ...s.customer,
            createdAt: s.customer.createdAt instanceof Date ? s.customer.createdAt.toISOString() : s.customer.createdAt,
            updatedAt: s.customer.updatedAt instanceof Date ? s.customer.updatedAt.toISOString() : s.customer.updatedAt
        } : undefined,
        photos: s.photos || [],
    };
}

export async function getShipments(filters?: ShipmentFilters): Promise<{
    shipments: Shipment[];
    total: number;
    page: number;
    limit: number;
}> {
    const where: any = {};

    if (filters?.status) {
        where.currentStatus = filters.status;
    }
    if (filters?.direction) {
        where.direction = filters.direction;
    }
    if (filters?.codStatus) {
        where.codStatus = filters.codStatus;
    }
    if (filters?.customerId) {
        where.customerId = filters.customerId;
    }
    if (filters?.search) {
        where.OR = [
            { companyTracking: { contains: filters.search } },
            { thaiTracking: { contains: filters.search } },
            { receiverName: { contains: filters.search } },
            { receiverPhone: { contains: filters.search } },
        ];
    }
    if (filters?.dateFrom) {
        where.createdAt = { ...where.createdAt, gte: new Date(filters.dateFrom) };
    }
    if (filters?.dateTo) {
        where.createdAt = { ...where.createdAt, lte: new Date(filters.dateTo) };
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;

    const [shipments, total] = await Promise.all([
        prisma.shipment.findMany({
            where,
            include: {
                events: { orderBy: { createdAt: 'desc' } },
                customer: true
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.shipment.count({ where }),
    ]);

    return {
        shipments: shipments.map(mapDbShipment),
        total,
        page,
        limit,
    };
}

export async function getShipmentById(id: string): Promise<Shipment | undefined> {
    const shipment = await prisma.shipment.findUnique({
        where: { id },
        include: {
            events: { orderBy: { createdAt: 'desc' } },
            customer: true,
            photos: true,
        },
    });
    if (!shipment) return undefined;
    return mapDbShipment(shipment);
}

export async function getShipmentByTracking(tracking: string): Promise<Shipment | undefined> {
    const shipment = await prisma.shipment.findFirst({
        where: {
            OR: [
                { companyTracking: tracking },
                { thaiTracking: tracking },
            ],
        },
        include: {
            events: { orderBy: { createdAt: 'desc' } },
            customer: true,
            photos: true,
        },
    });
    if (!shipment) return undefined;
    return mapDbShipment(shipment);
}

export async function createShipment(data: CreateShipmentDTO, userId: string): Promise<Shipment> {
    // Generate tracking number
    const prefix = data.direction === ShipmentDirection.TH_TO_LA ? 'LA' : 'TH';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // Get count for sequence
    const count = await prisma.shipment.count();
    const seq = String(count + 1).padStart(4, '0');
    const companyTracking = `${prefix}${year}${month}${day}${seq}`;

    const shipment = await prisma.shipment.create({
        data: {
            companyTracking,
            thaiTracking: data.thaiTracking,
            direction: data.direction,
            currentStatus: ShipmentStatus.CREATED,
            parcelType: data.parcelType as any,
            weight: data.weight,
            note: data.note,
            receiverName: data.receiverName,
            receiverPhone: data.receiverPhone,
            receiverAddress: data.receiverAddress,
            senderName: data.senderName,
            senderPhone: data.senderPhone,
            senderAddress: data.senderAddress,
            crossBorderFee: data.crossBorderFee,
            domesticFee: data.domesticFee,
            codAmount: data.codAmount,
            codStatus: data.codAmount ? 'PENDING' : 'NONE',
            createdById: userId,
            events: {
                create: {
                    status: ShipmentStatus.CREATED,
                    location: data.direction === ShipmentDirection.TH_TO_LA ? 'ກຸງເທບ, ໄທ' : 'ວຽງຈັນ, ລາວ',
                    notes: 'ລົງທະບຽນພັດສະດຸໃໝ່',
                    createdById: userId,
                },
            },
            photos: data.photos && data.photos.length > 0 ? {
                create: data.photos.map(url => ({
                    url,
                    type: 'RECEIVED', // Default type
                    notes: 'Uploaded during creation'
                }))
            } : undefined,
        },
        include: { events: true, photos: true },
    });

    return mapDbShipment(shipment);
}

export async function updateShipmentStatus(
    id: string,
    data: UpdateStatusDTO,
    userId: string
): Promise<Shipment | undefined> {
    const shipment = await prisma.shipment.update({
        where: { id },
        data: {
            currentStatus: data.status,
            events: {
                create: {
                    status: data.status,
                    location: data.location,
                    notes: data.notes,
                    createdById: userId,
                },
            },
        },
        include: { events: { orderBy: { createdAt: 'desc' } } },
    });

    return mapDbShipment(shipment);
}

export async function updateShipmentCod(
    id: string,
    data: UpdateCodStatusDTO,
    userId: string
): Promise<Shipment | undefined> {
    const shipment = await prisma.shipment.update({
        where: { id },
        data: {
            codStatus: data.status as any,
        },
        include: { events: { orderBy: { createdAt: 'desc' } } },
    });

    return mapDbShipment(shipment);
}

// ============================================
// Tracking (Public)
// ============================================
export async function getTrackingInfo(tracking: string): Promise<TrackingResponse | undefined> {
    const shipment = await getShipmentByTracking(tracking);
    if (!shipment) return undefined;

    // Get events with staff names
    const events = await prisma.shipmentEvent.findMany({
        where: { shipmentId: shipment.id },
        include: { createdBy: { select: { fullName: true } } },
        orderBy: { createdAt: 'asc' },
    });

    return {
        companyTracking: shipment.companyTracking,
        thaiTracking: shipment.thaiTracking,
        direction: shipment.direction,
        currentStatus: shipment.currentStatus,
        receiverName: shipment.receiverName,
        crossBorderFee: shipment.crossBorderFee,
        codAmount: shipment.codAmount,
        total: shipment.crossBorderFee + (shipment.domesticFee || 0),
        events: events.map(e => ({
            status: e.status as ShipmentStatus,
            location: e.location || undefined,
            createdAt: e.createdAt.toISOString(),
            staffName: e.createdBy.fullName,
        })),
        photos: shipment.photos?.map(p => p.url) || [],
    };
}

// ============================================
// Dashboard Stats
// ============================================
export async function getDashboardStats(): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayShipments, pendingCOD, atLaosHub, inTransit, delivered] = await Promise.all([
        prisma.shipment.count({
            where: { createdAt: { gte: today } },
        }),
        prisma.shipment.count({
            where: { codStatus: CodStatus.PENDING },
        }),
        prisma.shipment.count({
            where: { currentStatus: ShipmentStatus.ARRIVED_AT_HUB },
        }),
        prisma.shipment.count({
            where: { currentStatus: ShipmentStatus.IN_TRANSIT },
        }),
        prisma.shipment.count({
            where: { currentStatus: ShipmentStatus.DELIVERED },
        }),
    ]);

    return {
        todayShipments,
        pendingCOD,
        atLaosHub,
        inTransit,
        delivered,
    };
}

// ============================================
// Reset (for testing)
// ============================================
export async function resetStore() {
    await prisma.shipmentEvent.deleteMany();
    await prisma.shipment.deleteMany();
    await prisma.user.deleteMany();
}

// ============================================
// Customer Operations
// ============================================
export async function getCustomers(search?: string): Promise<Customer[]> {
    const where: any = {};
    if (search) {
        where.OR = [
            { code: { contains: search } },
            { name: { contains: search } },
            { phone: { contains: search } },
        ];
    }

    const customers = await prisma.customer.findMany({
        where,
        orderBy: { code: 'asc' },
    });

    return customers.map(c => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
    }));
}

export async function getCustomerByCode(code: string): Promise<Customer | null> {
    const c = await prisma.customer.findUnique({
        where: { code },
    });
    if (!c) return null;
    return {
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
    };
}

export async function createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'points' | 'code'>): Promise<Customer> {
    // Generate Code: TLL-0001
    const count = await prisma.customer.count();
    const seq = String(count + 1).padStart(4, '0');
    const code = `TLL-${seq}`;

    const customer = await prisma.customer.create({
        data: {
            ...data,
            code,
            points: 0,
        },
    });

    return {
        ...customer,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
    };
}

export async function updateCustomer(id: string, data: Partial<Omit<Customer, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'points'>>): Promise<Customer> {
    const customer = await prisma.customer.update({
        where: { id },
        data,
    });
    return {
        ...customer,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
    };
}

export async function deleteCustomer(id: string): Promise<boolean> {
    try {
        await prisma.customer.delete({ where: { id } });
        return true;
    } catch {
        return false;
    }
}
