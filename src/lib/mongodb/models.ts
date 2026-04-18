import clientPromise from './client.js';
import { ObjectId } from 'mongodb';

const DB_NAME = 'powergest';

// ============================================
// TYPES
// ============================================
export interface VentaDB {
  _id?: ObjectId;
  producto: string;
  precioUnitarioVenta: number;
  cantidad: number;
  cliente: string;
  metodoPago: 'efectivo' | 'transferencia';
  isPagado: boolean;
  usuarioACargo: string;
  fecha: string;
  createdAt: Date;
}

export interface CompraDB {
  _id?: ObjectId;
  producto: string;
  proveedor: string;
  marca: 'ENA' | 'Star' | 'Body Advance' | 'Gentech' | 'GoldNutrition' | 'Growsbar' | 'Crudda' | 'Granger' | 'OneFit' | 'Nutremax';
  precioUnitarioCompra: number;
  cantidad: number;
  fecha: string;
  createdAt: Date;
}

export interface StockDB {
  _id?: ObjectId;
  producto: string;
  precioUnitarioVenta: number;
  cantidadVendida: number;
  cantidadComprada: number;
  cantidadTotal: number;
  updatedAt: Date;
}

export interface ConfigDB {
  _id?: ObjectId;
  key: string;
  value: string;
}

// ============================================
// DATABASE HELPER FUNCTIONS
// ============================================
export async function getDatabase() {
  const client = await clientPromise;
  return client.db(DB_NAME);
}

export async function getVentasCollection() {
  const db = await getDatabase();
  return db.collection<VentaDB>('ventas');
}

export async function getComprasCollection() {
  const db = await getDatabase();
  return db.collection<CompraDB>('compras');
}

export async function getStockCollection() {
  const db = await getDatabase();
  return db.collection<StockDB>('stock');
}

export async function getConfigCollection() {
  const db = await getDatabase();
  return db.collection<ConfigDB>('config');
}

// ============================================
// STOCK CONSOLIDATION HELPER
// ============================================
export async function consolidateStockByProducto(producto: string) {
  const stockCollection = await getStockCollection();
  
  // Find all documents for this product
  const docs = await stockCollection.find({ producto }).toArray();
  
  if (docs.length <= 1) {
    return; // Nothing to consolidate
  }
  
  // Sum all quantities from all documents
  const consolidated = {
    producto,
    precioUnitarioVenta: docs[0]?.precioUnitarioVenta || 0,
    cantidadVendida: docs.reduce((sum, doc) => sum + doc.cantidadVendida, 0),
    cantidadComprada: docs.reduce((sum, doc) => sum + doc.cantidadComprada, 0),
    cantidadTotal: docs.reduce((sum, doc) => sum + doc.cantidadTotal, 0),
    updatedAt: new Date(),
  };
  
  // Delete all documents for this product
  await stockCollection.deleteMany({ producto });
  
  // Insert the consolidated document
  await stockCollection.insertOne(consolidated);
}

// ============================================
// STOCK UPDATE HELPERS
// ============================================
export async function updateStockAfterCompra(
  producto: string,
  cantidadComprada: number
) {
  const stockCollection = await getStockCollection();

  // First, consolidate any duplicate documents for this product
  await consolidateStockByProducto(producto);

  await stockCollection.updateOne(
    { producto },
    {
      $inc: {
        cantidadComprada: cantidadComprada,
        cantidadTotal: cantidadComprada,
      },
      $set: { updatedAt: new Date() },
      $unset: { proveedor: "" },
      $setOnInsert: {
        precioUnitarioVenta: 0,
        cantidadVendida: 0,
      },
    },
    { upsert: true }
  );
}

export async function updateStockAfterVenta(
  producto: string,
  cantidadVendida: number,
  precioUnitarioVenta: number
) {
  const stockCollection = await getStockCollection();

  // First, consolidate any duplicate documents for this product
  await consolidateStockByProducto(producto);

  await stockCollection.updateOne(
    { producto },
    {
      $inc: {
        cantidadVendida: cantidadVendida,
        cantidadTotal: -cantidadVendida,
      },
      $set: {
        precioUnitarioVenta: precioUnitarioVenta,
        updatedAt: new Date(),
      },
      $unset: { proveedor: "" },
      $setOnInsert: {
        cantidadComprada: 0,
      },
    },
    { upsert: true }
  );
}

export async function revertStockAfterDeleteCompra(
  producto: string,
  cantidad: number
) {
  const stockCollection = await getStockCollection();
  const comprasCollection = await getComprasCollection();

  // Check if there are any remaining compras for this producto
  const remainingCompras = await comprasCollection.countDocuments({ producto });

  if (remainingCompras === 0) {
    // If no compras remain, delete the stock entry entirely
    await stockCollection.deleteOne({ producto });
  } else {
    // If other compras exist, just decrement the quantities
    await stockCollection.updateOne(
      { producto },
      {
        $inc: {
          cantidadComprada: -cantidad,
          cantidadTotal: -cantidad,
        },
        $set: { updatedAt: new Date() },
        $unset: { proveedor: "" },
      }
    );
  }
}

export async function revertStockAfterDeleteVenta(
  producto: string,
  cantidad: number
) {
  const stockCollection = await getStockCollection();

  await stockCollection.updateOne(
    { producto },
    {
      $inc: {
        cantidadVendida: -cantidad,
        cantidadTotal: cantidad,
      },
      $set: { updatedAt: new Date() },
      $unset: { proveedor: "" },
    }
  );
}

export async function adjustStockAfterUpdateCompra(
  producto: string,
  oldCantidad: number,
  newCantidad: number
) {
  const diff = newCantidad - oldCantidad;
  if (diff !== 0) {
    const stockCollection = await getStockCollection();
    await stockCollection.updateOne(
      { producto },
      {
        $inc: {
          cantidadComprada: diff,
          cantidadTotal: diff,
        },
        $set: { updatedAt: new Date() },
        $unset: { proveedor: "" },
      }
    );
  }
}

export async function adjustStockAfterUpdateVenta(
  producto: string,
  oldCantidad: number,
  newCantidad: number,
  precioUnitarioVenta: number
) {
  const diff = newCantidad - oldCantidad;
  if (diff !== 0) {
    const stockCollection = await getStockCollection();
    await stockCollection.updateOne(
      { producto },
      {
        $inc: {
          cantidadVendida: diff,
          cantidadTotal: -diff,
        },
        $set: {
          precioUnitarioVenta: precioUnitarioVenta,
          updatedAt: new Date(),
        },
        $unset: { proveedor: "" },
      }
    );
  } else {
    // Solo actualizar el precio si cambió
    const stockCollection = await getStockCollection();
    await stockCollection.updateOne(
      { producto },
      {
        $set: {
          precioUnitarioVenta: precioUnitarioVenta,
          updatedAt: new Date(),
        },
        $unset: { proveedor: "" },
      }
    );
  }
}
