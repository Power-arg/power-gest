import { Venta, Compra, StockItem, DashboardStats, ChartData } from '@/types/admin';

// Simulated delay for realistic API behavior
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================
//             AUTHENTICATION
// ============================================
export async function validatePassword(password: string): Promise<boolean> {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    throw new Error('Error de conexión');
  }

  const data = await response.json();
  return data.success === true;
}

// ============================================
// VENTAS CRUD
// ============================================
export async function getVentas(): Promise<Venta[]> {
  try {
    const response = await fetch('/api/ventas', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Error al obtener las ventas');
    }

    const result = await response.json();

    if (!result.success || !Array.isArray(result.data)) {
      throw new Error('Respuesta inválida del servidor');
    }

    return result.data.map((item: any) => ({
      id: String(item.id),
      producto: item.producto,
      proveedor: item.proveedor,
      precioUnitarioVenta: Number(item.precioUnitarioVenta),
      cantidad: Number(item.cantidad),
      cliente: item.cliente,
      metodoPago: item.metodoPago,
      isPagado: Boolean(item.isPagado),
      usuarioACargo: item.usuarioACargo,
      fecha: item.fecha,
    }));
  } catch (error) {
    console.error('Error fetching ventas:', error);
    throw error;
  }
}

export async function createVenta(venta: Omit<Venta, 'id'>): Promise<Venta> {
  try {
    const response = await fetch('/api/ventas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(venta),
    });

    if (!response.ok) {
      throw new Error('Error al crear la venta');
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Error al crear la venta');
    }

    return {
      id: String(result.data.id),
      ...venta,
    };
  } catch (error) {
    console.error('Error creating venta:', error);
    throw error;
  }
}

export async function updateVenta(id: string, venta: Partial<Venta>): Promise<Venta> {
  try {
    const response = await fetch('/api/ventas', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...venta }),
    });

    if (!response.ok) {
      throw new Error('Error al actualizar la venta');
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Error al actualizar la venta');
    }

    return result.data;
  } catch (error) {
    console.error('Error updating venta:', error);
    throw error;
  }
}

export async function deleteVenta(id: string): Promise<void> {
  try {
    const response = await fetch('/api/ventas', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      throw new Error('Error al eliminar la venta');
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Error al eliminar la venta');
    }
  } catch (error) {
    console.error('Error deleting venta:', error);
    throw error;
  }
}

// ============================================
// COMPRAS CRUD
// ============================================
export async function getCompras(): Promise<Compra[]> {
  try {
    const response = await fetch('/api/compras', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Error al obtener las compras');
    }

    const result = await response.json();

    if (!result.success || !Array.isArray(result.data)) {
      throw new Error('Respuesta inválida del servidor');
    }

    return result.data.map((item: any) => ({
      id: String(item.id),
      producto: item.producto,
      proveedor: item.proveedor,
      precioUnitarioCompra: Number(item.precioUnitarioCompra),
      cantidad: Number(item.cantidad),
      fecha: item.fecha,
    }));
  } catch (error) {
    console.error('Error fetching compras:', error);
    throw error;
  }
}

export async function createCompra(compra: Omit<Compra, 'id'>): Promise<Compra> {
  try {
    const response = await fetch('/api/compras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(compra),
    });

    if (!response.ok) {
      throw new Error('Error al crear la compra');
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Error al crear la compra');
    }

    return {
      id: String(result.data.id),
      ...compra,
    };
  } catch (error) {
    console.error('Error creating compra:', error);
    throw error;
  }
}

export async function updateCompra(id: string, compra: Partial<Compra>): Promise<Compra> {
  try {
    const response = await fetch('/api/compras', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...compra }),
    });

    if (!response.ok) {
      throw new Error('Error al actualizar la compra');
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Error al actualizar la compra');
    }

    return result.data;
  } catch (error) {
    console.error('Error updating compra:', error);
    throw error;
  }
}

export async function deleteCompra(id: string): Promise<void> {
  try {
    const response = await fetch('/api/compras', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      throw new Error('Error al eliminar la compra');
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Error al eliminar la compra');
    }
  } catch (error) {
    console.error('Error deleting compra:', error);
    throw error;
  }
}

// ============================================
// STOCK (Calculated)
// ============================================
export async function getStock(): Promise<StockItem[]> {
  try {
    const response = await fetch('/api/stock', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Error al obtener el stock');
    }

    const result = await response.json();

    if (!result.success || !Array.isArray(result.data)) {
      throw new Error('Respuesta inválida del servidor');
    }

    // Transformar los datos del backend al formato del frontend
    return result.data.map((item: any) => ({
      id: `${item.producto}-${item.proveedor}`,
      producto: item.producto,
      proveedor: item.proveedor,
      precioUnitarioVenta: Number(item.precioUnitarioVenta) || 0,
      cantidadVendida: Number(item.cantidadVendida) || 0,
      cantidadComprada: Number(item.cantidadComprada) || 0,
      cantidadTotal: Number(item.cantidadTotal) || 0,
    }));
  } catch (error) {
    console.error('Error fetching stock:', error);
    throw error;
  }
}

// ============================================
// DASHBOARD STATS
// ============================================
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const response = await fetch('/api/dashboard', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Error al obtener estadísticas');
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Error al obtener estadísticas');
    }

    return result.data.stats;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}

// ============================================
// CHART DATA
// ============================================
export async function getSalesChartData(): Promise<ChartData[]> {
  try {
    const response = await fetch('/api/dashboard', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Error al obtener datos de ventas');
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Error al obtener datos de ventas');
    }

    return result.data.charts.salesData;
  } catch (error) {
    console.error('Error fetching sales chart data:', error);
    return [];
  }
}

export async function getTopProductsData(): Promise<ChartData[]> {
  try {
    const response = await fetch('/api/dashboard', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Error al obtener productos top');
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Error al obtener productos top');
    }

    return result.data.charts.topProducts;
  } catch (error) {
    console.error('Error fetching top products data:', error);
    return [];
  }
}

export async function getPaymentMethodsData(): Promise<ChartData[]> {
  try {
    const response = await fetch('/api/dashboard', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Error al obtener métodos de pago');
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Error al obtener métodos de pago');
    }

    // Agregar colores dinámicos
    const colors = [
      'hsl(0, 0%, 90%)',
      'hsl(0, 0%, 70%)',
      'hsl(0, 0%, 50%)',
      'hsl(0, 0%, 30%)',
    ];

    return result.data.charts.paymentMethods.map((item: ChartData, index: number) => ({
      ...item,
      fill: colors[index % colors.length],
    }));
  } catch (error) {
    console.error('Error fetching payment methods data:', error);
    return [];
  }
}

export async function getProvidersData(): Promise<ChartData[]> {
  try {
    const response = await fetch('/api/dashboard', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Error al obtener proveedores');
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Error al obtener proveedores');
    }

    // Agregar colores dinámicos
    const colors = [
      'hsl(0, 0%, 85%)',
      'hsl(0, 0%, 65%)',
      'hsl(0, 0%, 45%)',
      'hsl(0, 0%, 25%)',
    ];

    return result.data.charts.providers.map((item: ChartData, index: number) => ({
      ...item,
      fill: colors[index % colors.length],
    }));
  } catch (error) {
    console.error('Error fetching providers data:', error);
    return [];
  }
}
