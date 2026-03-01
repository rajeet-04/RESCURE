import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Images curated for pet products
const MOCK_PRODUCTS = [
    {
        name: 'Premium Adult Dry Dog Food (1.5kg)',
        description: 'High-protein dry food formulated for adult dogs. Packed with essential vitamins and minerals for a healthy coat and immune support.',
        category: 'food-dry',
        priceRetail: 120000, // ₹1200
        priceNGO: 95000,    // ₹950
        unit: 'pack',
        stock: 50,
        images: ['https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=600'],
    },
    {
        name: 'Grain-Free Salmon Wet Cat Food (85g)',
        description: 'Delicious salmon chunks in gravy. Offers high moisture content and real meat, perfect for picky eaters.',
        category: 'food-wet',
        priceRetail: 4500, // ₹45
        priceNGO: 3500,    // ₹35
        unit: 'pack',
        stock: 200,
        images: ['https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?auto=format&fit=crop&q=80&w=600'],
    },
    {
        name: 'Flea & Tick Prevention Spot-On (Dogs)',
        description: 'Fast-acting, long-lasting treatment for the control of fleas, ticks, and chewing lice on dogs and puppies.',
        category: 'medicine',
        priceRetail: 85000, // ₹850
        priceNGO: 60000,    // ₹600
        unit: 'pack',
        stock: 30,
        images: ['https://images.unsplash.com/photo-1628009368231-7bb7cbcb8122?auto=format&fit=crop&q=80&w=600'],
    },
    {
        name: 'Heavy Duty Rope Leash & Collar Set',
        description: 'Durable and reflective rope leash with an adjustable collar. Features padded handles for comfort.',
        category: 'accessory',
        priceRetail: 45000, // ₹450
        priceNGO: 30000,    // ₹300
        unit: 'set',
        stock: 100,
        images: ['https://images.unsplash.com/photo-1606011334315-025e4baab810?auto=format&fit=crop&q=80&w=600'],
    },
    {
        name: 'Puppy Starter Wet Food Patties (150g)',
        description: 'Soft and digestible patties designed for weaning puppies. Rich in DHA for brain development.',
        category: 'food-wet',
        priceRetail: 6500, // ₹65
        priceNGO: 5000,    // ₹50
        unit: 'pack',
        stock: 150,
        images: ['https://images.unsplash.com/photo-1589926868664-9b8823f669e4?auto=format&fit=crop&q=80&w=600'],
    },
    {
        name: 'Multi-Vitamin Chewables (100 tabs)',
        description: 'Daily multivitamin supplement for dogs and cats. Supports joint health, coat shine, and overall vitality.',
        category: 'medicine',
        priceRetail: 55000, // ₹550
        priceNGO: 40000,    // ₹400
        unit: 'bottle',
        stock: 80,
        images: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=600'],
    }
]

async function main() {
    console.log('Seeding Marketplace Mock Data...')

    // 1. Create a dummy Supplier user if not exists
    let supplierUser = await prisma.user.findFirst({
        where: { role: 'SUPPLIER', email: 'mock_supplier@rescure.in' }
    })

    if (!supplierUser) {
        supplierUser = await prisma.user.create({
            data: {
                email: 'mock_supplier@rescure.in',
                name: 'Mock Paws Supplier',
                role: 'SUPPLIER',
            }
        })
    }

    // 2. Create the Supplier profile
    let supplier = await prisma.supplier.findUnique({
        where: { userId: supplierUser.id }
    })

    if (!supplier) {
        supplier = await prisma.supplier.create({
            data: {
                userId: supplierUser.id,
                name: 'Mock Paws Supplies Co.',
                description: 'Quality food, medicine, and accessories for animal welfare organizations.',
                verified: true,
                city: 'Mumbai'
            }
        })
    }

    // 3. Insert Products
    for (const prod of MOCK_PRODUCTS) {
        const existing = await prisma.product.findFirst({
            where: { supplierId: supplier.id, name: prod.name }
        })

        if (!existing) {
            await prisma.product.create({
                data: {
                    ...prod,
                    supplierId: supplier.id
                }
            })
            console.log(`Created product: ${prod.name}`)
        } else {
            console.log(`Product already exists: ${prod.name}`)
        }
    }

    console.log('Marketplace Seeding Complete!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
