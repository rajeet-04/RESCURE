#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const args = process.argv.slice(2)
  if (args.length < 2) {
    console.log('Usage: node scripts/make-admin.js --id <userId> OR --email <email>')
    process.exit(1)
  }

  const key = args[0]
  const value = args[1]

  let where
  if (key === '--id') where = { id: value }
  else if (key === '--email') where = { email: value }
  else {
    console.log('Invalid argument. Use --id or --email')
    process.exit(1)
  }

  try {
    const user = await prisma.user.update({
      where,
      data: { role: 'PLATFORM_ADMIN' },
    })
    console.log('Updated user:', {
      id: user.id,
      email: user.email,
      role: user.role,
    })
  } catch (err) {
    console.error('Failed to update user:', err.message || err)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

main()
