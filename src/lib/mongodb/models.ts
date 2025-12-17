import clientPromise from './client';
import { ObjectId } from 'mongodb';

const DB_NAME = 'powergest';

// ============================================
// TYPES
// ============================================
export interface VentaDB {
  _id?: ObjectId;
  producto: string;
  proveedor: string;
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
  marca: 'ENA' | 'Star' | 'Body Advance' | 'Gentech' | 'GoldNutrition';
  precioUnitarioCompra: number;
  cantidad: number;
  fecha: string;
  createdAt: Date;
}

export interface StockDB {
  _id?: ObjectId;
  producto: string;
  proveedor: string;
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
// STOCK UPDATE HELPERS
// ============================================
export async function updateStockAfterCompra(
  producto: string,
  proveedor: string,
  cantidadComprada: number
) {
  const stockCollection = await getStockCollection();
  
  const existingStock = await stockCollection.findOne({ producto, proveedor });
  
  if (existingStock) {
    await stockCollection.updateOne(
      { producto, proveedor },
      {
        $inc: {
          cantidadComprada: cantidadComprada,
          cantidadTotal: cantidadComprada,
        },
        $set: { updatedAt: new Date() },
      }
    );
  } else {
    await stockCollection.insertOne({
      producto,
      proveedor,
      precioUnitarioVenta: 0,
      cantidadVendida: 0,
      cantidadComprada: cantidadComprada,
      cantidadTotal: cantidadComprada,
      updatedAt: new Date(),
    });
  }
}

export async function updateStockAfterVenta(
  producto: string,
  proveedor: string,
  cantidadVendida: number,
  precioUnitarioVenta: number
) {
  const stockCollection = await getStockCollection();
  
  const existingStock = await stockCollection.findOne({ producto, proveedor });
  
  if (existingStock) {
    await stockCollection.updateOne(
      { producto, proveedor },
      {
        $inc: {
          cantidadVendida: cantidadVendida,
          cantidadTotal: -cantidadVendida,
        },
        $set: {
          precioUnitarioVenta: precioUnitarioVenta,
          updatedAt: new Date(),
        },
      }
    );
  } else {
    // Si no existe, crear con valores negativos (caso de venta sin compra previa)
    await stockCollection.insertOne({
      producto,
      proveedor,
      precioUnitarioVenta: precioUnitarioVenta,
      cantidadVendida: cantidadVendida,
      cantidadComprada: 0,
      cantidadTotal: -cantidadVendida,
      updatedAt: new Date(),
    });
  }
}

export async function revertStockAfterDeleteCompra(
  producto: string,
  proveedor: string,
  cantidad: number
) {
  const stockCollection = await getStockCollection();
  
  await stockCollection.updateOne(
    { producto, proveedor },
    {
      $inc: {
        cantidadComprada: -cantidad,
        cantidadTotal: -cantidad,
      },
      $set: { updatedAt: new Date() },
    }
  );
}

export async function revertStockAfterDeleteVenta(
  producto: string,
  proveedor: string,
  cantidad: number
) {
  const stockCollection = await getStockCollection();
  
  await stockCollection.updateOne(
    { producto, proveedor },
    {
      $inc: {
        cantidadVendida: -cantidad,
        cantidadTotal: cantidad,
      },
      $set: { updatedAt: new Date() },
    }
  );
}

export async function adjustStockAfterUpdateCompra(
  producto: string,
  proveedor: string,
  oldCantidad: number,
  newCantidad: number
) {
  const diff = newCantidad - oldCantidad;
  if (diff !== 0) {
    const stockCollection = await getStockCollection();
    await stockCollection.updateOne(
      { producto, proveedor },
      {
        $inc: {
          cantidadComprada: diff,
          cantidadTotal: diff,
        },
        $set: { updatedAt: new Date() },
      }
    );
  }
}

export async function adjustStockAfterUpdateVenta(
  producto: string,
  proveedor: string,
  oldCantidad: number,
  newCantidad: number,
  precioUnitarioVenta: number
) {
  const diff = newCantidad - oldCantidad;
  if (diff !== 0) {
    const stockCollection = await getStockCollection();
    await stockCollection.updateOne(
      { producto, proveedor },
      {
        $inc: {
          cantidadVendida: diff,
          cantidadTotal: -diff,
        },
        $set: {
          precioUnitarioVenta: precioUnitarioVenta,
          updatedAt: new Date(),
        },
      }
    );
  } else {
    // Solo actualizar el precio si cambió
    const stockCollection = await getStockCollection();
    await stockCollection.updateOne(
      { producto, proveedor },
      {
        $set: {
          precioUnitarioVenta: precioUnitarioVenta,
          updatedAt: new Date(),
        },
      }
    );
  }
}
