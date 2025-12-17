import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStockCollection } from '../src/lib/mongodb/models';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      const stockCollection = await getStockCollection();
      const stock = await stockCollection.find({}).sort({ producto: 1 }).toArray();

      // Get compras collection to fetch marca
      const { getComprasCollection } = await import('../src/lib/mongodb/models');
      const comprasCollection = await getComprasCollection();

      const formatted = await Promise.all(
        stock.map(async (s) => {
          // Get the most recent compra for this product-provider to get the marca
          const compra = await comprasCollection
            .find({ producto: s.producto, proveedor: s.proveedor })
            .sort({ createdAt: -1 })
            .limit(1)
            .toArray();

          return {
            id: s._id!.toString(),
            producto: s.producto,
            proveedor: s.proveedor,
            marca: compra[0]?.marca || 'ENA',
            precioUnitarioVenta: s.precioUnitarioVenta,
            cantidadVendida: s.cantidadVendida,
            cantidadComprada: s.cantidadComprada,
            cantidadTotal: s.cantidadTotal,
          };
        })
      );

      return res.status(200).json(formatted);
    } catch (error) {
      console.error('Stock API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
