import bcrypt from 'bcryptjs';
import clientPromise from '../src/lib/mongodb/client';

async function initPassword() {
  try {
    console.log('Conectando a MongoDB...');
    const client = await clientPromise;
    const db = client.db('powergest');
    const config = db.collection('config');
    
    const plainPassword = 'Power(FS)05';
    console.log(`Hasheando contraseña: ${plainPassword}`);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
    await config.updateOne(
      { key: 'admin_password' },
      { $set: { key: 'admin_password', value: hashedPassword } },
      { upsert: true }
    );
    
    console.log('✅ Contraseña inicializada correctamente');
    console.log(`Hash generado: ${hashedPassword}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al inicializar contraseña:', error);
    process.exit(1);
  }
}

initPassword();
