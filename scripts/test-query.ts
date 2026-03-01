import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Mock lat/lng (e.g., somewhere in Maharashtra or Delhi)
    const incidentLat = 19.0760; // Mumbai
    const incidentLng = 72.8777;

    try {
        const ngos = await prisma.$queryRaw<
            Array<{
                id: string
                name: string
                userId: string
                userEmail: string | null
            }>
        >`
      SELECT 
        n.id, 
        n.name, 
        n."userId",
        u.email as "userEmail"
      FROM "NGO" n
      JOIN "User" u ON n."userId" = u.id
      WHERE n.lat IS NOT NULL 
        AND n.lng IS NOT NULL
        AND (
          6371 * acos(
            cos(radians(${incidentLat})) * cos(radians(n.lat)) *
            cos(radians(n.lng) - radians(${incidentLng})) +
            sin(radians(${incidentLat})) * sin(radians(n.lat))
          )
        ) <= 50
    `;

        console.log(`Found ${ngos.length} NGOs within 50km of ${incidentLat}, ${incidentLng}`);
        ngos.forEach(ngo => console.log(`- ${ngo.name} (${ngo.userEmail || 'No Email'})`));
    } catch (error) {
        console.error("Test Query failed:", error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
