// import 'dotenv/config';
// import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
// import { PrismaPg } from '@prisma/adapter-pg';
// import { Pool } from 'pg';

// Create PostgreSQL connection pool
// const connectionString = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/thai_lao_logistics';
// const pool = new Pool({ connectionString });

// Create Prisma client with PostgreSQL adapter
// const adapter = new PrismaPg(pool);
const prisma = new PrismaClient();

// Define enum values manually for seeding
const UserRole = {
    STAFF: 'STAFF',
    MANAGER: 'MANAGER',
    ADMIN: 'ADMIN',
} as const;

const ShipmentDirection = {
    TH_TO_LA: 'TH_TO_LA',
    LA_TO_TH: 'LA_TO_TH',
} as const;

const ShipmentStatus = {
    CREATED: 'CREATED',
    RECEIVED_AT_ORIGIN: 'RECEIVED_AT_ORIGIN',
    IN_TRANSIT: 'IN_TRANSIT',
    ARRIVED_AT_HUB: 'ARRIVED_AT_HUB',
    OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
    READY_FOR_PICKUP: 'READY_FOR_PICKUP',
    DELIVERED: 'DELIVERED',
    FAILED: 'FAILED',
    RETURNED: 'RETURNED',
} as const;

const ParcelType = {
    DOCUMENT: 'DOCUMENT',
    PACKAGE: 'PACKAGE',
    FRAGILE: 'FRAGILE',
} as const;

const CodStatus = {
    NONE: 'NONE',
    PENDING: 'PENDING',
    COLLECTED: 'COLLECTED',
    TRANSFERRED: 'TRANSFERRED',
} as const;

async function main() {
    console.log('🌱 Start seeding...');

    // Clear existing data
    await prisma.shipmentEvent.deleteMany();
    await prisma.shipment.deleteMany();
    await prisma.user.deleteMany();

    // import bcrypt from 'bcryptjs'; (Commented out)

    // Hash passwords (Pre-hashed '123')
    const hashedPassword = '$2b$10$YDWkL287.gGJ9pe8UVTdTOD4am4mgsM7mEoWEohCaWQsvCKHD5DcG';

    // Create Admin User
    const admin = await prisma.user.create({
        data: {
            username: 'admin',
            password: hashedPassword,
            fullName: 'Administrator',
            role: UserRole.ADMIN,
        },
    });

    console.log('✅ Created admin user:', admin.username);
    console.log('🌱 Seeding finished! Ready for production.');
}



main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        // await pool.end();
    });
