import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getVentasCollection, getComprasCollection } from '../../src/lib/mongodb/models.js';

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
      const { type } = req.query;

      if (type === 'sales') {
        // Sales chart data (monthly aggregation)
        const ventasCollection = await getVentasCollection();
        const comprasCollection = await getComprasCollection();

        const ventas = await ventasCollection.find({}).toArray();
        const compras = await comprasCollection.find({}).toArray();

        // Group by month
        const monthlyData: { [key: string]: { ventas: number; compras: number } } = {};

        ventas.forEach((v) => {
          const month = v.fecha.substring(0, 7); // YYYY-MM
          if (!monthlyData[month]) {
            monthlyData[month] = { ventas: 0, compras: 0 };
          }
          monthlyData[month].ventas += v.precioUnitarioVenta * v.cantidad;
        });

        compras.forEach((c) => {
          const month = c.fecha.substring(0, 7); // YYYY-MM
          if (!monthlyData[month]) {
            monthlyData[month] = { ventas: 0, compras: 0 };
          }
          monthlyData[month].compras += c.precioUnitarioCompra * c.cantidad;
        });

        // Convert to array and sort by date
        const chartData = Object.entries(monthlyData)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-6) // Last 6 months
          .map(([month, data]) => {
            const [year, monthNum] = month.split('-');
            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            return {
              name: monthNames[parseInt(monthNum) - 1],
              ventas: Math.round(data.ventas),
              compras: Math.round(data.compras),
            };
          });

        return res.status(200).json(chartData);
      }

      if (type === 'top-products') {
        // Top products by sales
        const ventasCollection = await getVentasCollection();
        const ventas = await ventasCollection.find({}).toArray();

        const productSales: { [key: string]: number } = {};

        ventas.forEach((v) => {
          if (!productSales[v.producto]) {
            productSales[v.producto] = 0;
          }
          productSales[v.producto] += v.cantidad;
        });

        const chartData = Object.entries(productSales)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([name, value]) => ({ name, value }));

        return res.status(200).json(chartData);
      }

      if (type === 'top-brands') {
        // Top brands by sales quantity
        const ventasCollection = await getVentasCollection();
        const comprasCollection = await getComprasCollection();
        
        const ventas = await ventasCollection.find({}).toArray();
        const compras = await comprasCollection.find({}).toArray();

        const brandSales: { [key: string]: number } = {};

        // For each venta, find the marca from the latest compra of that product-proveedor
        ventas.forEach((v) => {
          // Find the most recent compra for this product-proveedor combination
          const productCompras = compras
            .filter(c => c.producto === v.producto && c.proveedor === v.proveedor)
            .sort((a, b) => {
              const dateA = new Date(a.createdAt || a.fecha);
              const dateB = new Date(b.createdAt || b.fecha);
              return dateB.getTime() - dateA.getTime();
            });
          
          const marca = productCompras.length > 0 ? productCompras[0].marca : 'Sin marca';
          
          if (!brandSales[marca]) {
            brandSales[marca] = 0;
          }
          brandSales[marca] += v.cantidad;
        });

        // Define brand colors
        const brandColors: { [key: string]: string } = {
          'ENA': 'hsl(217, 91%, 60%)',
          'Star': 'hsl(142, 71%, 45%)',
          'Body Advance': 'hsl(0, 84%, 60%)',
          'Gentech': 'hsl(217, 71%, 35%)',
          'GoldNutrition': 'hsl(45, 93%, 47%)',
          'Growsbar': 'hsl(0, 0%, 55%)',
          'Crudda': 'hsl(30, 100%, 50%)',
          'Otro': 'hsl(0, 0%, 83%)',
        };

        const chartData = Object.entries(brandSales)
          .sort(([, a], [, b]) => b - a)
          .filter(([name]) => name !== 'Otro')
          .map(([name, value]) => ({
            name,
            value,
            fill: brandColors[name] || 'hsl(0, 0%, 50%)',
          }));

        return res.status(200).json(chartData);
      }

      if (type === 'payment-methods') {
        // Payment methods distribution
        const ventasCollection = await getVentasCollection();
        const ventas = await ventasCollection.find({}).toArray();

        const paymentMethods: { [key: string]: number } = {};

        ventas.forEach((v) => {
          if (!paymentMethods[v.metodoPago]) {
            paymentMethods[v.metodoPago] = 0;
          }
          paymentMethods[v.metodoPago] += v.precioUnitarioVenta * v.cantidad;
        });

        const labels: { [key: string]: string } = {
          efectivo: 'Efectivo',
          transferencia: 'Transferencia',
        };

        const colors = ['hsl(0, 0%, 90%)', 'hsl(0, 0%, 70%)', 'hsl(0, 0%, 50%)', 'hsl(0, 0%, 30%)'];

        const chartData = Object.entries(paymentMethods).map(([method, value], index) => ({
          name: labels[method] || method,
          value: Math.round(value),
          fill: colors[index % colors.length],
        }));

        return res.status(200).json(chartData);
      }

      if (type === 'clients') {
        // Clients distribution by sales
        const ventasCollection = await getVentasCollection();
        const ventas = await ventasCollection.find({}).toArray();

        const clients: { [key: string]: number } = {};

        ventas.forEach((v) => {
          if (!clients[v.cliente]) {
            clients[v.cliente] = 0;
          }
          clients[v.cliente] += v.precioUnitarioVenta * v.cantidad;
        });

        const colors = ['hsl(0, 0%, 85%)', 'hsl(0, 0%, 65%)', 'hsl(0, 0%, 45%)', 'hsl(0, 0%, 25%)'];

        const chartData = Object.entries(clients)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([name, value], index) => ({
            name,
            value: Math.round(value),
            fill: colors[index % colors.length],
          }));

        return res.status(200).json(chartData);
      }

      return res.status(400).json({ error: 'Invalid chart type' });
    } catch (error) {
      console.error('Dashboard charts API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
