import { config } from 'dotenv';
config({ path: '.env.local' });


async function main() {
  const { prisma } = await import('./lib/prisma.js');
  try {
    const count = await prisma.user.count();
    console.log("Users count:", count);
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
