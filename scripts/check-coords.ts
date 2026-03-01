import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const withCoords = await prisma.nGO.count({ where: { lat: { not: null } } });
    const total = await prisma.nGO.count();
    console.log(`NGOs with coordinates: ${withCoords} / ${total}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
