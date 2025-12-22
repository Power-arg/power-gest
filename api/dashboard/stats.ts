import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getVentasCollection,
  getComprasCollection,
  getStockCollection,
} from '../../src/lib/mongodb/models.js';

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
      const ventasCollection = await getVentasCollection();
      const comprasCollection = await getComprasCollection();
      const stockCollection = await getStockCollection();

      const ventas = await ventasCollection.find({}).toArray();
      const compras = await comprasCollection.find({}).toArray();
      const stock = await stockCollection.find({}).toArray();

      // Calculate total ingresos
      const totalIngresos = ventas.reduce(
        (acc, v) => acc + v.precioUnitarioVenta * v.cantidad,
        0
      );

      // Calculate total compras
      const totalCompras = compras.reduce(
        (acc, c) => acc + c.precioUnitarioCompra * c.cantidad,
        0
      );

      // Calculate stock disponible (only positive stock, excluding "Dinero de caja")
      const stockDisponible = stock
        .filter(s => s.producto !== 'Dinero de caja')
        .reduce(
          (acc, s) => acc + Math.max(0, s.cantidadTotal),
          0
        );

      // Today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      // Week ago date
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];

      // Calculate ventas hoy
      const ventasHoy = ventas
        .filter((v) => v.fecha === todayStr)
        .reduce((acc, v) => acc + v.precioUnitarioVenta * v.cantidad, 0);

      // Calculate ventas semana
      const ventasSemana = ventas
        .filter((v) => v.fecha >= weekAgoStr)
        .reduce((acc, v) => acc + v.precioUnitarioVenta * v.cantidad, 0);

      // Calculate previous week for comparison
      const twoWeeksAgo = new Date(weekAgo);
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 7);
      const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0];

      const ventasWeekBefore = ventas
        .filter((v) => v.fecha >= twoWeeksAgoStr && v.fecha < weekAgoStr)
        .reduce((acc, v) => acc + v.precioUnitarioVenta * v.cantidad, 0);

      // Calculate percentage changes
      const ingresosPercentChange = ventasWeekBefore > 0 
        ? Math.round(((totalIngresos - ventasWeekBefore) / ventasWeekBefore) * 100)
        : 0;

      const comprasWeekBefore = compras
        .filter((c) => c.fecha >= twoWeeksAgoStr && c.fecha < weekAgoStr)
        .reduce((acc, c) => acc + c.precioUnitarioCompra * c.cantidad, 0);

      const gananciaWeekBefore = ventasWeekBefore - comprasWeekBefore;
      const gananciaPercentChange = gananciaWeekBefore > 0
        ? Math.round(((totalIngresos - totalCompras - gananciaWeekBefore) / gananciaWeekBefore) * 100)
        : 0;

      return res.status(200).json({
        totalIngresos,
        totalCompras,
        stockDisponible,
        ventasHoy,
        ventasSemana,
        ingresosPercentChange,
        gananciaPercentChange,
      });
    } catch (error) {
      console.error('Dashboard stats API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
