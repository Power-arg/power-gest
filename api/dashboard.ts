import type { VercelRequest, VercelResponse } from '@vercel/node';

const SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL!;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // Obtener ventas, compras y stock en paralelo
    const [ventasRes, comprasRes, stockRes] = await Promise.all([
      fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getVentas' }),
      }),
      fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getCompras' }),
      }),
      fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getStock' }),
      }),
    ]);

    const ventas = await ventasRes.json();
    const compras = await comprasRes.json();
    const stock = await stockRes.json();

    if (ventas.error || compras.error || stock.error) {
      return res.status(500).json({ 
        success: false, 
        error: 'Error al obtener datos del backend' 
      });
    }

    // Calcular estadísticas
    const totalIngresos = Array.isArray(ventas) 
      ? ventas.reduce((acc: number, v: any) => acc + (Number(v.precioUnitarioVenta) * Number(v.cantidad)), 0)
      : 0;

    const totalCompras = Array.isArray(compras)
      ? compras.reduce((acc: number, c: any) => acc + (Number(c.precioUnitarioCompra) * Number(c.cantidad)), 0)
      : 0;

    const stockDisponible = Array.isArray(stock)
      ? stock.reduce((acc: number, s: any) => acc + Math.max(0, Number(s.cantidadTotal) || 0), 0)
      : 0;

    // Calcular ventas de hoy
    const today = new Date().toISOString().split('T')[0];
    const ventasHoy = Array.isArray(ventas)
      ? ventas
          .filter((v: any) => v.fecha && v.fecha.startsWith(today))
          .reduce((acc: number, v: any) => acc + (Number(v.precioUnitarioVenta) * Number(v.cantidad)), 0)
      : 0;

    // Calcular ventas de la semana
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const ventasSemana = Array.isArray(ventas)
      ? ventas
          .filter((v: any) => v.fecha && v.fecha >= weekAgo)
          .reduce((acc: number, v: any) => acc + (Number(v.precioUnitarioVenta) * Number(v.cantidad)), 0)
      : 0;

    // Calcular productos más vendidos
    const productosMap = new Map<string, number>();
    if (Array.isArray(ventas)) {
      ventas.forEach((v: any) => {
        const cantidad = productosMap.get(v.producto) || 0;
        productosMap.set(v.producto, cantidad + Number(v.cantidad));
      });
    }
    const topProducts = Array.from(productosMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    // Calcular métodos de pago
    const metodosMap = new Map<string, number>();
    if (Array.isArray(ventas)) {
      ventas.forEach((v: any) => {
        const count = metodosMap.get(v.metodoPago) || 0;
        metodosMap.set(v.metodoPago, count + 1);
      });
    }
    const paymentMethods = Array.from(metodosMap.entries())
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }));

    // Calcular proveedores principales
    const proveedoresMap = new Map<string, number>();
    if (Array.isArray(ventas)) {
      ventas.forEach((v: any) => {
        const cantidad = proveedoresMap.get(v.proveedor) || 0;
        proveedoresMap.set(v.proveedor, cantidad + Number(v.cantidad));
      });
    }
    const providers = Array.from(proveedoresMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, value]) => ({ name, value }));

    // Calcular datos de ventas por mes (últimos 6 meses)
    const salesByMonth = new Map<string, { ventas: number; compras: number }>();
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    if (Array.isArray(ventas)) {
      ventas.forEach((v: any) => {
        if (v.fecha) {
          const date = new Date(v.fecha);
          const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
          const current = salesByMonth.get(monthKey) || { ventas: 0, compras: 0 };
          current.ventas += Number(v.precioUnitarioVenta) * Number(v.cantidad);
          salesByMonth.set(monthKey, current);
        }
      });
    }

    if (Array.isArray(compras)) {
      compras.forEach((c: any) => {
        if (c.fecha) {
          const date = new Date(c.fecha);
          const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
          const current = salesByMonth.get(monthKey) || { ventas: 0, compras: 0 };
          current.compras += Number(c.precioUnitarioCompra) * Number(c.cantidad);
          salesByMonth.set(monthKey, current);
        }
      });
    }

    const salesChart = Array.from(salesByMonth.entries())
      .slice(-6)
      .map(([name, data]) => ({
        name: name.split(' ')[0],
        ventas: data.ventas,
        compras: data.compras,
      }));

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalIngresos,
          totalCompras,
          gananciaNet: totalIngresos - totalCompras,
          stockDisponible,
          ventasHoy,
          ventasSemana,
        },
        charts: {
          salesData: salesChart,
          topProducts,
          paymentMethods,
          providers,
        },
      },
    });
  } catch (error) {
    console.error('DASHBOARD ERROR:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}