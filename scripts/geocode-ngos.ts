import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env.local for local development if it exists
if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
} else {
    dotenv.config();
}

const prisma = new PrismaClient();

// Haversine distance in km
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180)
}

// Function to fetch coordinates using OpenStreetMap Nominatim API
async function geocode(query: string, retry = 0): Promise<{ lat: number, lng: number } | null> {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=in&format=json&limit=1`;
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'RESCURE-Geocoding-Script/1.0 (contact@rescure.in)',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });

        if (!response.ok) {
            if (response.status === 429 && retry < 2) {
                console.warn(`Rate limited for query: ${query}, retrying in 3 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 3000));
                return geocode(query, retry + 1);
            }
            // Do not throw an error, just return null so it doesn't break the loop
            console.warn(`HTTP error! status: ${response.status} for query: ${query}`);
            return null;
        }

        const data = await response.json();
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        }
    } catch (error) {
        console.error(`Error geocoding ${query}:`, error);
    }
    return null;
}

async function main() {
    const ngos = await prisma.nGO.findMany({
        where: {
            // Only process NGOs that haven't been geocoded yet
            lat: null,
            lng: null
        }
    });

    console.log(`Found ${ngos.length} NGOs to process.`);

    let successCount = 0;

    for (const ngo of ngos) {
        if (!ngo.description) continue;

        // The address details are currently stored in `description` starting with 'Full Details: ' 
        const fullDetails = ngo.description.replace('Full Details: ', '').trim();

        // Extract pincode (6 consecutive digits)
        const pincodeMatch = fullDetails.match(/\b(\d{6})\b/);
        const pincode = pincodeMatch ? pincodeMatch[1] : null;

        let coords = null;
        let queryUsed = '';

        if (pincode) {
            queryUsed = pincode;
            coords = await geocode(queryUsed);
        }

        // Fallback: If no pincode or pincode search fails, try searching using the name
        if (!coords && ngo.name) {
            // Remove generic terms to improve search success and split by comma to avoid full addresses
            let cleanName = ngo.name.split(',')[0].replace(/(Samiti|Trust|Foundation|Society|Sansthan|Organization|Centre|Unit|Gaushala|Panjrapole)\b/gi, '').trim();
            // Truncate to avoid extremely long queries throwing 400 errors
            cleanName = cleanName.substring(0, 60).trim();
            queryUsed = cleanName;

            if (queryUsed.length > 0) {
                coords = await geocode(queryUsed);
            }
        }

        const dataToUpdate: any = {
            address: fullDetails
        };

        if (pincode) {
            dataToUpdate.pincode = pincode;
        }

        if (coords) {
            dataToUpdate.lat = coords.lat;
            dataToUpdate.lng = coords.lng;
        }

        try {
            await prisma.nGO.update({
                where: { id: ngo.id },
                data: dataToUpdate
            });

            if (coords) {
                console.log(`[SUCCESS] Geocoded ${ngo.name} (Pincode: ${pincode || 'N/A'}) -> [${coords.lat}, ${coords.lng}] via query: '${queryUsed}'`);
                successCount++;
            } else {
                console.log(`[WARNING] Could not geocode ${ngo.name}. Updated address/pincode. Pincode: ${pincode || 'N/A'} `);
            }
        } catch (e) {
            console.error(`Failed to update ${ngo.name}`, e);
        }

        // Respect Nominatim's usage policy of absolute max 1 request per second
        await new Promise(resolve => setTimeout(resolve, 1100));
    }

    console.log(`Completed processing. Successfully geocoded ${successCount}/${ngos.length} NGOs.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
