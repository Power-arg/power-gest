import bcrypt from 'bcryptjs';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

async function initPassword() {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      console.error('❌ MONGODB_URI not found in .env');
      console.log('Por favor crea un archivo .env con tu connection string de MongoDB');
      process.exit(1);
    }

    console.log('Conectando a MongoDB...');
    const client = new MongoClient(uri);
    await client.connect();
    
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
    
    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al inicializar contraseña:', error);
    process.exit(1);
  }
}

initPassword();
