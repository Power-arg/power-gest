import { Venta, Compra, StockItem, DashboardStats, ChartData } from '@/types/admin';

// ============================================
// API BASE URL
// ============================================
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// ============================================
// AUTHENTICATION
// ============================================
export async function validatePassword(password: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      throw new Error('Authentication failed');
    }

    const data = await response.json();
    return data.valid;
  } catch (error) {
    console.error('Validate password error:', error);
    return false;
  }
}

// ============================================
// VENTAS CRUD
// ============================================
export async function getVentas(): Promise<Venta[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/ventas`);
    if (!response.ok) throw new Error('Failed to fetch ventas');
    return await response.json();
  } catch (error) {
    console.error('Get ventas error:', error);
    throw error;
  }
}

export async function createVenta(venta: Omit<Venta, 'id'>): Promise<Venta> {
  try {
    const response = await fetch(`${API_BASE_URL}/ventas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(venta),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create venta');
    }
    return await response.json();
  } catch (error) {
    console.error('Create venta error:', error);
    throw error;
  }
}

export async function updateVenta(id: string, venta: Partial<Venta>): Promise<Venta> {
  try {
    const response = await fetch(`${API_BASE_URL}/ventas`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, ...venta }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update venta');
    }
    return await response.json();
  } catch (error) {
    console.error('Update venta error:', error);
    throw error;
  }
}

export async function deleteVenta(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/ventas?id=${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete venta');
    }
  } catch (error) {
    console.error('Delete venta error:', error);
    throw error;
  }
}

// ============================================
// COMPRAS CRUD
// ============================================
export async function getCompras(): Promise<Compra[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/compras`);
    if (!response.ok) throw new Error('Failed to fetch compras');
    return await response.json();
  } catch (error) {
    console.error('Get compras error:', error);
    throw error;
  }
}

export async function createCompra(compra: Omit<Compra, 'id'>): Promise<Compra> {
  try {
    const response = await fetch(`${API_BASE_URL}/compras`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(compra),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create compra');
    }
    return await response.json();
  } catch (error) {
    console.error('Create compra error:', error);
    throw error;
  }
}

export async function updateCompra(id: string, compra: Partial<Compra>): Promise<Compra> {
  try {
    const response = await fetch(`${API_BASE_URL}/compras`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, ...compra }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update compra');
    }
    return await response.json();
  } catch (error) {
    console.error('Update compra error:', error);
    throw error;
  }
}

export async function deleteCompra(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/compras?id=${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete compra');
    }
  } catch (error) {
    console.error('Delete compra error:', error);
    throw error;
  }
}

// ============================================
// STOCK
// ============================================
export async function getStock(): Promise<StockItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/stock`);
    if (!response.ok) throw new Error('Failed to fetch stock');
    return await response.json();
  } catch (error) {
    console.error('Get stock error:', error);
    throw error;
  }
}

// ============================================
// DASHBOARD STATS
// ============================================
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
    return await response.json();
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    throw error;
  }
}

// ============================================
// CHART DATA
// ============================================
export async function getSalesChartData(): Promise<ChartData[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/charts?type=sales`);
    if (!response.ok) throw new Error('Failed to fetch sales chart data');
    return await response.json();
  } catch (error) {
    console.error('Get sales chart data error:', error);
    return [];
  }
}

export async function getTopProductsData(): Promise<ChartData[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/charts?type=top-products`);
    if (!response.ok) throw new Error('Failed to fetch top products data');
    return await response.json();
  } catch (error) {
    console.error('Get top products data error:', error);
    return [];
  }
}

export async function getTopBrandsData(): Promise<ChartData[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/charts?type=top-brands`);
    if (!response.ok) throw new Error('Failed to fetch top brands data');
    return await response.json();
  } catch (error) {
    console.error('Get top brands data error:', error);
    return [];
  }
}

export async function getPaymentMethodsData(): Promise<ChartData[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/charts?type=payment-methods`);
    if (!response.ok) throw new Error('Failed to fetch payment methods data');
    return await response.json();
  } catch (error) {
    console.error('Get payment methods data error:', error);
    return [];
  }
}

export async function getClientsData(): Promise<ChartData[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/charts?type=clients`);
    if (!response.ok) throw new Error('Failed to fetch clients data');
    return await response.json();
  } catch (error) {
    console.error('Get clients data error:', error);
    return [];
  }
}

// ============================================
// PRODUCTOS (for dropdowns)
// ============================================
export async function getProductos(): Promise<{ producto: string; proveedor: string; stockDisponible: number; precioUnitarioVenta: number; marca: 'ENA' | 'Star' | 'Body Advance' | 'Gentech' | 'GoldNutrition' }[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/productos`);
    if (!response.ok) throw new Error('Failed to fetch productos');
    return await response.json();
  } catch (error) {
    console.error('Get productos error:', error);
    return [];
  }
}
