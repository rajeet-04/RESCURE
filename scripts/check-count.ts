import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import dotenv from 'dotenv';

if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
} else {
    dotenv.config();
}

const prisma = new PrismaClient();

async function main() {
    const count = await prisma.nGO.count();
    console.log('Total NGOs in database:', count);
    const users = await prisma.user.count({ where: { role: 'NGO_ADMIN' } });
    console.log('Total NGO Admins:', users);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
