import { PrismaClient, Role } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Load .env.local for local development if it exists
import dotenv from 'dotenv';
if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
} else {
    dotenv.config();
}

const prisma = new PrismaClient();

const STATES = [
    'Andhra Pradesh', 'Assam', 'Chattisgarh', 'Chhattisgarh', 'Gujarat', 'Goa',
    'Himachal Pradesh', 'Haryana', 'Jammu & Kashmir', 'Karnataka', 'Kerala',
    'Maharashtra', 'Madhya Pradesh', 'Mizoram', 'Delhi', 'GOA', 'Odisha',
    'Punjab', 'Rajasthan', 'Tamilnadu', 'Telangana', 'Uttrakhand', 'Uttar Pradesh',
    'West Bengal'
];

async function main() {
    const filePath = path.join(process.cwd(), 'data/ngo.md');
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Clean up the content: remove backticks and markdown headers
    const cleanedContent = fileContent
        .replace(/```/g, '')
        .replace(/^#+.*$/gm, '')
        .replace(/\r/g, '');

    // Normalize whitespace
    const normalizedText = cleanedContent.replace(/\s+/g, ' ');

    // Regex to split entries. 
    // Each entry starts with a number followed by a code like AP123/2024 or J&K009/2024 or OR082/2023
    const entryRegex = /(\d+)\s+([A-Z|&|0]{2,7}\d+\/\d{3,4})\s+/g;

    const matches: any[] = [];
    let match;

    while ((match = entryRegex.exec(normalizedText)) !== null) {
        matches.push({
            index: match.index,
            slNo: match[1],
            regNo: match[2]
        });
    }

    console.log(`Found ${matches.length} potential entries in cleaned text.`);

    const entries: any[] = [];
    for (let i = 0; i < matches.length; i++) {
        const start = matches[i].index;
        const end = i < matches.length - 1 ? matches[i + 1].index : normalizedText.length;
        const entryText = normalizedText.substring(start, end).trim();

        // Pattern: SlNo RegNo Name Address...
        // Escape special characters in regNo for the regex
        const escapedRegNo = matches[i].regNo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const headerPattern = new RegExp(`^${matches[i].slNo}\\s+${escapedRegNo}\\s+(.+)$`);
        const headerMatch = entryText.match(headerPattern);

        if (headerMatch) {
            const remaining = headerMatch[1];

            // Try to find the state
            let stateFound = '';
            for (const state of STATES) {
                if (remaining.includes(state)) {
                    stateFound = state;
                    break;
                }
            }

            // Name heuristic
            const nameDelimiters = [/Society/i, /Association/i, /Foundation/i, /Trust/i, /Samiti/i, /Panjrapole/i, /Gaushala/i, /Organization/i, /Centre/i, /Unit/i, /Sansthan/i, /Samsthan/i, /Goshala/i, /Ashram/i];
            let name = '';
            let earliestPos = remaining.length;

            for (const delim of nameDelimiters) {
                const m = remaining.match(delim);
                if (m && m.index !== undefined) {
                    const endPos = m.index + m[0].length;
                    if (endPos < earliestPos) {
                        earliestPos = endPos;
                    }
                }
            }

            name = remaining.substring(0, earliestPos).trim();
            if (!name || name.length < 5) {
                name = remaining.split(' ').slice(0, 5).join(' ');
            }

            entries.push({
                slNo: matches[i].slNo,
                regNo: matches[i].regNo,
                name: name,
                fullDetails: remaining,
                state: stateFound
            });
        }
    }

    console.log(`Parsed ${entries.length} NGOs.`);

    let successCount = 0;
    for (const entry of entries) {
        try {
            // Check if NGO already exists by regNo
            const existingNGO = await prisma.nGO.findFirst({
                where: { registrationNo: entry.regNo }
            });

            if (existingNGO) {
                continue;
            }

            // Create a system user for this NGO
            const user = await prisma.user.create({
                data: {
                    name: entry.name,
                    role: Role.NGO_ADMIN,
                }
            });

            await prisma.nGO.create({
                data: {
                    userId: user.id,
                    name: entry.name,
                    registrationNo: entry.regNo,
                    description: `Full Details: ${entry.fullDetails}`,
                    state: entry.state || null,
                    verified: true,
                }
            });

            successCount++;
            if (successCount % 20 === 0) {
                console.log(`Progress: ${successCount} new NGOs uploaded...`);
            }
        } catch (error) {
            console.error(`Failed to upload ${entry.regNo}:`, error instanceof Error ? error.message : error);
        }
    }

    console.log(`Completed. Successfully uploaded ${successCount} new NGOs.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
