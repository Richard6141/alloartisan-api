#!/usr/bin/env node

require('dotenv').config();

const { PrismaClient } = require('../src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error('Missing DATABASE_URL in environment');
    process.exit(1);
}

const pool = new Pool({
    connectionString: databaseUrl,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function main() {
    const email = process.argv[2];

    if (!email) {
        console.error('Usage: pnpm make:admin <email>');
        process.exit(1);
    }

    if (!isValidEmail(email)) {
        console.error(`Invalid email: ${email}`);
        process.exit(1);
    }

    const result = await prisma.user.updateMany({
        where: { email },
        data: {
            role: 'ADMIN',
            statut: 'ACTIF',
            emailVerified: true,
        },
    });

    if (result.count === 0) {
        console.error(`No user found with email: ${email}`);
        process.exit(1);
    }

    console.log(`User promoted to ADMIN: ${email}`);
}

main()
    .catch((error) => {
        console.error('Failed to promote user:', error?.message ?? error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
