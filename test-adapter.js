import { config } from 'dotenv';
config({ path: '.env.local' });
import { PrismaAdapter } from '@next-auth/prisma-adapter';

async function testAdapter() {
  const { prisma } = await import('./lib/prisma.js');
  const adapter = PrismaAdapter(prisma);
  
  try {
     const user = await adapter.createUser({ 
       name: 'Test', 
       email: 'test@example.com', 
       emailVerified: new Date() 
     });
     console.log('User created successfully:', user);
     
     // Clean up
     await prisma.user.delete({ where: { id: user.id } });
  } catch(e) {
     console.error('Adapter Error:', e);
  } finally {
     process.exit(0);
  }
}

testAdapter();
