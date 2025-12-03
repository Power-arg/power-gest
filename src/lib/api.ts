import { Venta, Compra, StockItem, DashboardStats, ChartData } from '@/types/admin';

// ============================================
// MOCK API - Ready to connect to Google Sheets
// ============================================
// Replace these functions with actual Google Sheets API calls
// or Google Apps Script Web App endpoints

const MOCK_PASSWORD = 'power2024'; // Replace with Google Sheets validation

// Simulated delay for realistic API behavior
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================
// AUTHENTICATION
// ============================================
export async function validatePassword(password: string): Promise<boolean> {
  await delay(500);
  // TODO: Replace with Google Sheets API call
  // Example: fetch('YOUR_GOOGLE_APPS_SCRIPT_URL?action=validatePassword&password=' + password)
  return password === MOCK_PASSWORD;
}

// ============================================
// VENTAS CRUD
// ============================================
let mockVentas: Venta[] = [
  {
    id: '1',
    producto: 'Whey Protein Gold Standard',
    proveedor: 'Optimum Nutrition',
    precioUnitarioVenta: 45000,
    cantidad: 2,
    cliente: 'Juan Pérez',
    metodoPago: 'tarjeta',
    isPagado: true,
    usuarioACargo: 'Admin',
    fecha: '2024-01-15',
  },
  {
    id: '2',
    producto: 'Creatina Monohidrato 500g',
    proveedor: 'Universal Nutrition',
    precioUnitarioVenta: 18000,
    cantidad: 3,
    cliente: 'María García',
    metodoPago: 'efectivo',
    isPagado: true,
    usuarioACargo: 'Admin',
    fecha: '2024-01-16',
  },
  {
    id: '3',
    producto: 'BCAA 2:1:1 300g',
    proveedor: 'Muscletech',
    precioUnitarioVenta: 22000,
    cantidad: 1,
    cliente: 'Carlos López',
    metodoPago: 'transferencia',
    isPagado: false,
    usuarioACargo: 'Admin',
    fecha: '2024-01-17',
  },
  {
    id: '4',
    producto: 'Pre-Workout C4',
    proveedor: 'Cellucor',
    precioUnitarioVenta: 28000,
    cantidad: 2,
    cliente: 'Ana Martínez',
    metodoPago: 'mercadopago',
    isPagado: true,
    usuarioACargo: 'Admin',
    fecha: '2024-01-18',
  },
];

export async function getVentas(): Promise<Venta[]> {
  await delay(300);
  return [...mockVentas];
}

export async function createVenta(venta: Omit<Venta, 'id'>): Promise<Venta> {
  await delay(300);
  const newVenta = { ...venta, id: Date.now().toString() };
  mockVentas.push(newVenta);
  return newVenta;
}

export async function updateVenta(id: string, venta: Partial<Venta>): Promise<Venta> {
  await delay(300);
  const index = mockVentas.findIndex(v => v.id === id);
  if (index === -1) throw new Error('Venta not found');
  mockVentas[index] = { ...mockVentas[index], ...venta };
  return mockVentas[index];
}

export async function deleteVenta(id: string): Promise<void> {
  await delay(300);
  mockVentas = mockVentas.filter(v => v.id !== id);
}

// ============================================
// COMPRAS CRUD
// ============================================
let mockCompras: Compra[] = [
  {
    id: '1',
    producto: 'Whey Protein Gold Standard',
    proveedor: 'Optimum Nutrition',
    precioUnitarioCompra: 32000,
    cantidad: 10,
    fecha: '2024-01-10',
  },
  {
    id: '2',
    producto: 'Creatina Monohidrato 500g',
    proveedor: 'Universal Nutrition',
    precioUnitarioCompra: 12000,
    cantidad: 15,
    fecha: '2024-01-11',
  },
  {
    id: '3',
    producto: 'BCAA 2:1:1 300g',
    proveedor: 'Muscletech',
    precioUnitarioCompra: 15000,
    cantidad: 8,
    fecha: '2024-01-12',
  },
  {
    id: '4',
    producto: 'Pre-Workout C4',
    proveedor: 'Cellucor',
    precioUnitarioCompra: 20000,
    cantidad: 12,
    fecha: '2024-01-13',
  },
];

export async function getCompras(): Promise<Compra[]> {
  await delay(300);
  return [...mockCompras];
}

export async function createCompra(compra: Omit<Compra, 'id'>): Promise<Compra> {
  await delay(300);
  const newCompra = { ...compra, id: Date.now().toString() };
  mockCompras.push(newCompra);
  return newCompra;
}

export async function updateCompra(id: string, compra: Partial<Compra>): Promise<Compra> {
  await delay(300);
  const index = mockCompras.findIndex(c => c.id === id);
  if (index === -1) throw new Error('Compra not found');
  mockCompras[index] = { ...mockCompras[index], ...compra };
  return mockCompras[index];
}

export async function deleteCompra(id: string): Promise<void> {
  await delay(300);
  mockCompras = mockCompras.filter(c => c.id !== id);
}

// ============================================
// STOCK (Calculated)
// ============================================
export async function getStock(): Promise<StockItem[]> {
  await delay(300);
  const ventas = await getVentas();
  const compras = await getCompras();

  const stockMap = new Map<string, StockItem>();

  // Process purchases
  compras.forEach(compra => {
    const key = `${compra.producto}-${compra.proveedor}`;
    const existing = stockMap.get(key);
    if (existing) {
      existing.cantidadComprada += compra.cantidad;
      existing.cantidadTotal = existing.cantidadComprada - existing.cantidadVendida;
    } else {
      stockMap.set(key, {
        id: key,
        producto: compra.producto,
        proveedor: compra.proveedor,
        precioUnitarioVenta: 0,
        cantidadVendida: 0,
        cantidadComprada: compra.cantidad,
        cantidadTotal: compra.cantidad,
      });
    }
  });

  // Process sales
  ventas.forEach(venta => {
    const key = `${venta.producto}-${venta.proveedor}`;
    const existing = stockMap.get(key);
    if (existing) {
      existing.cantidadVendida += venta.cantidad;
      existing.precioUnitarioVenta = venta.precioUnitarioVenta;
      existing.cantidadTotal = existing.cantidadComprada - existing.cantidadVendida;
    } else {
      stockMap.set(key, {
        id: key,
        producto: venta.producto,
        proveedor: venta.proveedor,
        precioUnitarioVenta: venta.precioUnitarioVenta,
        cantidadVendida: venta.cantidad,
        cantidadComprada: 0,
        cantidadTotal: -venta.cantidad,
      });
    }
  });

  return Array.from(stockMap.values());
}

// ============================================
// DASHBOARD STATS
// ============================================
export async function getDashboardStats(): Promise<DashboardStats> {
  await delay(300);
  const ventas = await getVentas();
  const compras = await getCompras();
  const stock = await getStock();

  const totalIngresos = ventas.reduce((acc, v) => acc + (v.precioUnitarioVenta * v.cantidad), 0);
  const totalCompras = compras.reduce((acc, c) => acc + (c.precioUnitarioCompra * c.cantidad), 0);
  const stockDisponible = stock.reduce((acc, s) => acc + s.cantidadTotal, 0);

  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const ventasHoy = ventas
    .filter(v => v.fecha === today)
    .reduce((acc, v) => acc + (v.precioUnitarioVenta * v.cantidad), 0);

  const ventasSemana = ventas
    .filter(v => v.fecha >= weekAgo)
    .reduce((acc, v) => acc + (v.precioUnitarioVenta * v.cantidad), 0);

  return {
    totalIngresos,
    totalCompras,
    gananciaNet: totalIngresos - totalCompras,
    stockDisponible,
    ventasHoy,
    ventasSemana,
  };
}

// ============================================
// CHART DATA
// ============================================
export async function getSalesChartData(): Promise<ChartData[]> {
  await delay(200);
  return [
    { name: 'Ene', ventas: 125000, compras: 85000 },
    { name: 'Feb', ventas: 148000, compras: 92000 },
    { name: 'Mar', ventas: 167000, compras: 98000 },
    { name: 'Abr', ventas: 189000, compras: 105000 },
    { name: 'May', ventas: 212000, compras: 115000 },
    { name: 'Jun', ventas: 245000, compras: 128000 },
  ];
}

export async function getTopProductsData(): Promise<ChartData[]> {
  await delay(200);
  return [
    { name: 'Whey Protein', value: 45 },
    { name: 'Creatina', value: 32 },
    { name: 'BCAA', value: 28 },
    { name: 'Pre-Workout', value: 24 },
    { name: 'Glutamina', value: 18 },
  ];
}

export async function getPaymentMethodsData(): Promise<ChartData[]> {
  await delay(200);
  return [
    { name: 'Tarjeta', value: 35, fill: 'hsl(0, 0%, 90%)' },
    { name: 'Efectivo', value: 28, fill: 'hsl(0, 0%, 70%)' },
    { name: 'Transferencia', value: 22, fill: 'hsl(0, 0%, 50%)' },
    { name: 'MercadoPago', value: 15, fill: 'hsl(0, 0%, 30%)' },
  ];
}

export async function getProvidersData(): Promise<ChartData[]> {
  await delay(200);
  return [
    { name: 'Optimum Nutrition', value: 40, fill: 'hsl(0, 0%, 85%)' },
    { name: 'Muscletech', value: 25, fill: 'hsl(0, 0%, 65%)' },
    { name: 'Universal', value: 20, fill: 'hsl(0, 0%, 45%)' },
    { name: 'Cellucor', value: 15, fill: 'hsl(0, 0%, 25%)' },
  ];
}
