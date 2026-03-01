import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const id = 'cmm77qrg7000p6bw3rhy37mzt';
    const r = await prisma.incidentReport.findUnique({ where: { id } });
    console.log('Is IncidentReport:', !!r);
    const c = await prisma.rescueCase.findFirst({ where: { id } });
    console.log('Is RescueCase passing directly?', !!c);
    const rc = await prisma.rescueCase.findFirst({ where: { reportId: id } });
    console.log('Is RescueCase with reportId?', !!rc, rc ? rc.id : '');
}
main().finally(() => prisma.$disconnect());
