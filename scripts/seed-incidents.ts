import { PrismaClient, UrgencyLevel, ReportStatus } from '@prisma/client'
import { encodeGeohash } from '../src/lib/geo/geohash'

const prisma = new PrismaClient()

// Major cities in India: [lat, lng, name]
const CITIES = [
    { lat: 28.6139, lng: 77.2090, name: 'New Delhi' },
    { lat: 19.0760, lng: 72.8777, name: 'Mumbai' },
    { lat: 12.9716, lng: 77.5946, name: 'Bangalore' },
    { lat: 22.5726, lng: 88.3639, name: 'Kolkata' },
    { lat: 13.0827, lng: 80.2707, name: 'Chennai' },
    { lat: 17.3850, lng: 78.4867, name: 'Hyderabad' },
    { lat: 18.5204, lng: 73.8567, name: 'Pune' },
    { lat: 23.0225, lng: 72.5714, name: 'Ahmedabad' },
]

const ANIMAL_TYPES = ['Dog', 'Cat', 'Cow', 'Bird', 'Monkey']
const URGENCY_LEVELS: UrgencyLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const DESCRIPTIONS = [
    'Found an injured animal near the highway.',
    'Stray dog looking very weak and unable to stand.',
    'Cat stuck in a high tree for the last two days.',
    'Cow hit by a speeding vehicle, bleeding leg.',
    'Bird with a broken wing found in the local park.',
    'Puppy lost its mother and is crying continuously.',
    'Dog with a severe skin infection roaming the streets.',
    'Monkey electrocuted by high tension wires.',
]

const STATUSES: ReportStatus[] = ['PENDING', 'ASSIGNED', 'EN_ROUTE', 'RESCUED', 'IN_CARE', 'RELEASED']

// Jitter coordinates by +/- max ~15km
function jitterCoordinate(coord: number): number {
    const jitterAmount = (Math.random() - 0.5) * 0.15
    return coord + jitterAmount
}

function randomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

async function main() {
    console.log('Seeding Incidents Mock Data across India...')

    // Delete previous mock incident data and keep old clean
    // We'll leave the old ones, or we just randomly assign them. 
    // For safety, let's just insert.

    let ngos = await prisma.nGO.findMany({ select: { id: true, city: true } })

    if (ngos.length === 0) {
        // We need at least one mock NGO to assign cases
        console.log('No NGOs found! Creating a mock NGO first.')
        let user = await prisma.user.create({
            data: { email: 'mock_ngo@rescure.in', role: 'NGO_ADMIN', name: 'India Rescue Wing' }
        })
        const ngo = await prisma.nGO.create({
            data: { userId: user.id, name: 'India Rescue Wing', verified: true, city: 'National' }
        })
        ngos = [ngo]
    }

    const MOCK_COUNT = 75
    let created = 0

    for (let i = 0; i < MOCK_COUNT; i++) {
        const city = randomElement(CITIES)
        const lat = jitterCoordinate(city.lat)
        const lng = jitterCoordinate(city.lng)
        const geohash = encodeGeohash(lat, lng)

        const animalType = randomElement(ANIMAL_TYPES)
        const urgencyScore = randomElement(URGENCY_LEVELS)
        const status = randomElement(STATUSES)

        const report = await prisma.incidentReport.create({
            data: {
                lat,
                lng,
                geohash,
                city: city.name,
                address: `Near main road, ${city.name}`,
                description: randomElement(DESCRIPTIONS),
                title: `Injured ${animalType} reported in ${city.name}`,
                animalType,
                urgencyScore,
                status,
                reporterName: 'Anonymous Citizen',
                volunteerHelp: Math.random() > 0.5,
                photos: ['https://images.unsplash.com/photo-1548802673-38020fb25f77?auto=format&fit=crop&q=80&w=400'], // Generic dog placeholder
            },
        })

        // If status is not PENDING, let's create a corresponding RescueCase
        if (status !== 'PENDING') {
            const ngo = randomElement(ngos)
            await prisma.rescueCase.create({
                data: {
                    reportId: report.id,
                    ngoId: ngo.id,
                    state: status, // mapped status
                    notes: 'Mock data assignment',
                }
            })
        }

        created++
    }

    console.log(`Successfully created ${created} mock incident reports across ${CITIES.length} Indian cities.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
