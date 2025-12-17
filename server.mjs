import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables - Try .env first, then .env.local
dotenv.config({ path: '.env' });
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: '.env.local' });
}

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// MongoDB connection
let clientPromise;
try {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI not found in .env or .env.local');
  }
  const client = new MongoClient(uri);
  clientPromise = client.connect();
  console.log('✅ Conectado a MongoDB');
} catch (error) {
  console.error('❌ Error connecting to MongoDB:', error);
  process.exit(1);
}

// Helper functions
async function getDatabase() {
  const client = await clientPromise;
  return client.db('powergest');
}

async function getVentasCollection() {
  const db = await getDatabase();
  return db.collection('ventas');
}

async function getComprasCollection() {
  const db = await getDatabase();
  return db.collection('compras');
}

async function getStockCollection() {
  const db = await getDatabase();
  return db.collection('stock');
}

async function getConfigCollection() {
  const db = await getDatabase();
  return db.collection('config');
}

async function updateStockAfterCompra(producto, proveedor, cantidadComprada) {
  const stockCollection = await getStockCollection();
  const existingStock = await stockCollection.findOne({ producto, proveedor });

  if (existingStock) {
    await stockCollection.updateOne(
      { producto, proveedor },
      {
        $inc: { cantidadComprada, cantidadTotal: cantidadComprada },
        $set: { updatedAt: new Date() },
      }
    );
  } else {
    await stockCollection.insertOne({
      producto,
      proveedor,
      precioUnitarioVenta: 0,
      cantidadVendida: 0,
      cantidadComprada,
      cantidadTotal: cantidadComprada,
      updatedAt: new Date(),
    });
  }
}

async function updateStockAfterVenta(producto, proveedor, cantidadVendida, precioUnitarioVenta) {
  const stockCollection = await getStockCollection();
  const existingStock = await stockCollection.findOne({ producto, proveedor });

  if (existingStock) {
    await stockCollection.updateOne(
      { producto, proveedor },
      {
        $inc: { cantidadVendida, cantidadTotal: -cantidadVendida },
        $set: { precioUnitarioVenta, updatedAt: new Date() },
      }
    );
  } else {
    await stockCollection.insertOne({
      producto,
      proveedor,
      precioUnitarioVenta,
      cantidadVendida,
      cantidadComprada: 0,
      cantidadTotal: -cantidadVendida,
      updatedAt: new Date(),
    });
  }
}

async function revertStockAfterDeleteCompra(producto, proveedor, cantidad) {
  const stockCollection = await getStockCollection();
  const comprasCollection = await getComprasCollection();

  // Check if there are any remaining compras for this producto-proveedor
  const remainingCompras = await comprasCollection.countDocuments({ producto, proveedor });

  if (remainingCompras === 0) {
    // If no compras remain, delete the stock entry entirely
    await stockCollection.deleteOne({ producto, proveedor });
  } else {
    // If other compras exist, just decrement the quantities
    await stockCollection.updateOne(
      { producto, proveedor },
      {
        $inc: { cantidadComprada: -cantidad, cantidadTotal: -cantidad },
        $set: { updatedAt: new Date() },
      }
    );
  }
}

async function revertStockAfterDeleteVenta(producto, proveedor, cantidad) {
  const stockCollection = await getStockCollection();
  await stockCollection.updateOne(
    { producto, proveedor },
    {
      $inc: { cantidadVendida: -cantidad, cantidadTotal: cantidad },
      $set: { updatedAt: new Date() },
    }
  );
}

async function adjustStockAfterUpdateCompra(producto, proveedor, oldCantidad, newCantidad) {
  const diff = newCantidad - oldCantidad;
  if (diff !== 0) {
    const stockCollection = await getStockCollection();
    await stockCollection.updateOne(
      { producto, proveedor },
      {
        $inc: { cantidadComprada: diff, cantidadTotal: diff },
        $set: { updatedAt: new Date() },
      }
    );
  }
}

async function adjustStockAfterUpdateVenta(producto, proveedor, oldCantidad, newCantidad, precioUnitarioVenta) {
  const diff = newCantidad - oldCantidad;
  if (diff !== 0) {
    const stockCollection = await getStockCollection();
    await stockCollection.updateOne(
      { producto, proveedor },
      {
        $inc: { cantidadVendida: diff, cantidadTotal: -diff },
        $set: { precioUnitarioVenta, updatedAt: new Date() },
      }
    );
  } else {
    const stockCollection = await getStockCollection();
    await stockCollection.updateOne(
      { producto, proveedor },
      { $set: { precioUnitarioVenta, updatedAt: new Date() } }
    );
  }
}

// Auth endpoint
app.post('/api/auth', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const configCollection = await getConfigCollection();
    const config = await configCollection.findOne({ key: 'admin_password' });

    if (!config) {
      return res.status(500).json({ error: 'Configuration not found. Run npm run init-password first.' });
    }

    const isValid = await bcrypt.compare(password, config.value);
    return res.status(200).json({ valid: isValid });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Ventas endpoints
app.get('/api/ventas', async (req, res) => {
  try {
    const ventasCollection = await getVentasCollection();
    const ventas = await ventasCollection.find({}).sort({ createdAt: -1 }).toArray();
    const formatted = ventas.map((v) => ({
      id: v._id.toString(),
      producto: v.producto,
      proveedor: v.proveedor,
      precioUnitarioVenta: v.precioUnitarioVenta,
      cantidad: v.cantidad,
      cliente: v.cliente,
      metodoPago: v.metodoPago,
      isPagado: v.isPagado,
      usuarioACargo: v.usuarioACargo,
      fecha: v.fecha,
    }));
    return res.status(200).json(formatted);
  } catch (error) {
    console.error('Get ventas error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/ventas', async (req, res) => {
  try {
    const {
      producto,
      proveedor,
      precioUnitarioVenta,
      cantidad,
      cliente,
      metodoPago,
      isPagado,
      usuarioACargo,
      fecha,
    } = req.body;

    if (
      !producto ||
      !proveedor ||
      precioUnitarioVenta === undefined ||
      !cantidad ||
      !cliente ||
      !metodoPago ||
      isPagado === undefined ||
      !usuarioACargo ||
      !fecha
    ) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const stockCollection = await getStockCollection();
    const stock = await stockCollection.findOne({ producto, proveedor });

    if (!stock) {
      return res.status(400).json({ error: 'No existe stock para este producto-proveedor' });
    }

    if (stock.cantidadTotal < parseInt(cantidad)) {
      return res.status(400).json({ error: `Stock insuficiente. Disponible: ${stock.cantidadTotal}` });
    }

    const ventasCollection = await getVentasCollection();
    const newVenta = {
      producto,
      proveedor,
      precioUnitarioVenta: parseFloat(precioUnitarioVenta),
      cantidad: parseInt(cantidad),
      cliente,
      metodoPago,
      isPagado: isPagado === true || isPagado === 'true',
      usuarioACargo,
      fecha,
      createdAt: new Date(),
    };

    const result = await ventasCollection.insertOne(newVenta);
    await updateStockAfterVenta(producto, proveedor, parseInt(cantidad), parseFloat(precioUnitarioVenta));

    return res.status(201).json({
      id: result.insertedId.toString(),
      ...newVenta,
    });
  } catch (error) {
    console.error('Create venta error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/ventas', async (req, res) => {
  try {
    const { id, precioUnitarioVenta, cantidad, cliente, metodoPago, isPagado, usuarioACargo, fecha } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID is required' });
    }

    const ventasCollection = await getVentasCollection();
    const existingVenta = await ventasCollection.findOne({ _id: new ObjectId(id) });

    if (!existingVenta) {
      return res.status(404).json({ error: 'Venta not found' });
    }

    if (cantidad && parseInt(cantidad) > existingVenta.cantidad) {
      const stockCollection = await getStockCollection();
      const stock = await stockCollection.findOne({
        producto: existingVenta.producto,
        proveedor: existingVenta.proveedor,
      });

      if (stock) {
        const additionalQuantity = parseInt(cantidad) - existingVenta.cantidad;
        if (stock.cantidadTotal < additionalQuantity) {
          return res.status(400).json({
            error: `Stock insuficiente. Disponible: ${stock.cantidadTotal}`,
          });
        }
      }
    }

    const updatedVenta = {
      precioUnitarioVenta:
        precioUnitarioVenta !== undefined ? parseFloat(precioUnitarioVenta) : existingVenta.precioUnitarioVenta,
      cantidad: cantidad !== undefined ? parseInt(cantidad) : existingVenta.cantidad,
      cliente: cliente || existingVenta.cliente,
      metodoPago: metodoPago || existingVenta.metodoPago,
      isPagado: isPagado !== undefined ? (isPagado === true || isPagado === 'true') : existingVenta.isPagado,
      usuarioACargo: usuarioACargo || existingVenta.usuarioACargo,
      fecha: fecha || existingVenta.fecha,
    };

    await ventasCollection.updateOne({ _id: new ObjectId(id) }, { $set: updatedVenta });

    if (
      updatedVenta.cantidad !== existingVenta.cantidad ||
      updatedVenta.precioUnitarioVenta !== existingVenta.precioUnitarioVenta
    ) {
      await adjustStockAfterUpdateVenta(
        existingVenta.producto,
        existingVenta.proveedor,
        existingVenta.cantidad,
        updatedVenta.cantidad,
        updatedVenta.precioUnitarioVenta
      );
    }

    return res.status(200).json({
      id,
      producto: existingVenta.producto,
      proveedor: existingVenta.proveedor,
      ...updatedVenta,
    });
  } catch (error) {
    console.error('Update venta error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/ventas', async (req, res) => {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'ID is required' });
    }

    const ventasCollection = await getVentasCollection();
    const venta = await ventasCollection.findOne({ _id: new ObjectId(id) });

    if (!venta) {
      return res.status(404).json({ error: 'Venta not found' });
    }

    await ventasCollection.deleteOne({ _id: new ObjectId(id) });
    await revertStockAfterDeleteVenta(venta.producto, venta.proveedor, venta.cantidad);

    return res.status(200).json({ message: 'Venta deleted' });
  } catch (error) {
    console.error('Delete venta error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Compras endpoints
app.get('/api/compras', async (req, res) => {
  try {
    const comprasCollection = await getComprasCollection();
    const compras = await comprasCollection.find({}).sort({ createdAt: -1 }).toArray();
    const formatted = compras.map((c) => ({
      id: c._id.toString(),
      producto: c.producto,
      proveedor: c.proveedor,
      marca: c.marca,
      precioUnitarioCompra: c.precioUnitarioCompra,
      cantidad: c.cantidad,
      fecha: c.fecha,
    }));
    return res.status(200).json(formatted);
  } catch (error) {
    console.error('Get compras error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/compras', async (req, res) => {
  try {
    const { producto, proveedor, marca, precioUnitarioCompra, cantidad, fecha } = req.body;

    if (!producto || !proveedor || !marca || !precioUnitarioCompra || !cantidad || !fecha) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const comprasCollection = await getComprasCollection();
    const newCompra = {
      producto,
      proveedor,
      marca,
      precioUnitarioCompra: parseFloat(precioUnitarioCompra),
      cantidad: parseInt(cantidad),
      fecha,
      createdAt: new Date(),
    };

    const result = await comprasCollection.insertOne(newCompra);
    await updateStockAfterCompra(producto, proveedor, parseInt(cantidad));

    return res.status(201).json({
      id: result.insertedId.toString(),
      ...newCompra,
    });
  } catch (error) {
    console.error('Create compra error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/compras', async (req, res) => {
  try {
    const { id, producto, proveedor, marca, precioUnitarioCompra, cantidad, fecha } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID is required' });
    }

    const ventasCollection = await getVentasCollection();
    const hasSales = await ventasCollection.findOne({ producto, proveedor });

    if (hasSales) {
      return res.status(400).json({
        error: 'No se puede editar una compra de un producto-proveedor con ventas registradas',
      });
    }

    const comprasCollection = await getComprasCollection();
    const existingCompra = await comprasCollection.findOne({ _id: new ObjectId(id) });

    if (!existingCompra) {
      return res.status(404).json({ error: 'Compra not found' });
    }

    const updatedCompra = {
      producto: producto || existingCompra.producto,
      proveedor: proveedor || existingCompra.proveedor,
      marca: marca || existingCompra.marca,
      precioUnitarioCompra:
        precioUnitarioCompra !== undefined ? parseFloat(precioUnitarioCompra) : existingCompra.precioUnitarioCompra,
      cantidad: cantidad !== undefined ? parseInt(cantidad) : existingCompra.cantidad,
      fecha: fecha || existingCompra.fecha,
    };

    await comprasCollection.updateOne({ _id: new ObjectId(id) }, { $set: updatedCompra });

    if (updatedCompra.cantidad !== existingCompra.cantidad) {
      await adjustStockAfterUpdateCompra(
        updatedCompra.producto,
        updatedCompra.proveedor,
        existingCompra.cantidad,
        updatedCompra.cantidad
      );
    }

    return res.status(200).json({
      id,
      ...updatedCompra,
    });
  } catch (error) {
    console.error('Update compra error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/compras', async (req, res) => {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'ID is required' });
    }

    const comprasCollection = await getComprasCollection();
    const compra = await comprasCollection.findOne({ _id: new ObjectId(id) });

    if (!compra) {
      return res.status(404).json({ error: 'Compra not found' });
    }

    // Check if removing this compra would leave enough stock to cover existing sales
    const stockCollection = await getStockCollection();
    const stock = await stockCollection.findOne({ 
      producto: compra.producto, 
      proveedor: compra.proveedor 
    });

    if (stock) {
      // Calculate remaining purchases after removing this one
      const remainingCompras = stock.cantidadComprada - compra.cantidad;
      
      // If sales exceed remaining purchases, deletion is not allowed
      if (stock.cantidadVendida > remainingCompras) {
        return res.status(400).json({ 
          error: 'No se puede eliminar esta compra porque quedarían ventas sin stock de origen' 
        });
      }
    }

    await comprasCollection.deleteOne({ _id: new ObjectId(id) });
    await revertStockAfterDeleteCompra(compra.producto, compra.proveedor, compra.cantidad);

    return res.status(200).json({ message: 'Compra deleted' });
  } catch (error) {
    console.error('Delete compra error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Stock endpoint
app.get('/api/stock', async (req, res) => {
  try {
    const stockCollection = await getStockCollection();
    const stock = await stockCollection.find({}).sort({ producto: 1 }).toArray();

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
          id: s._id.toString(),
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
    console.error('Get stock error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Productos endpoint
app.get('/api/productos', async (req, res) => {
  try {
    const stockCollection = await getStockCollection();
    const stock = await stockCollection.find({}).toArray();

    const comprasCollection = await getComprasCollection();

    // Get unique product-provider combinations with marca from latest compra
    const productos = await Promise.all(
      stock.map(async (s) => {
        // Get the most recent compra for this product-provider to get the marca
        const compra = await comprasCollection
          .find({ producto: s.producto, proveedor: s.proveedor })
          .sort({ createdAt: -1 })
          .limit(1)
          .toArray();

        return {
          producto: s.producto,
          proveedor: s.proveedor,
          marca: compra[0]?.marca || 'ENA', // Default to ENA if no compra found
          stockDisponible: s.cantidadTotal,
          precioUnitarioVenta: s.precioUnitarioVenta,
        };
      })
    );

    return res.status(200).json(productos);
  } catch (error) {
    console.error('Get productos error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Dashboard stats endpoint
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const ventasCollection = await getVentasCollection();
    const comprasCollection = await getComprasCollection();
    const stockCollection = await getStockCollection();

    const ventas = await ventasCollection.find({}).toArray();
    const compras = await comprasCollection.find({}).toArray();
    const stock = await stockCollection.find({}).toArray();

    const totalIngresos = ventas.reduce((acc, v) => acc + v.precioUnitarioVenta * v.cantidad, 0);
    const totalCompras = compras.reduce((acc, c) => acc + c.precioUnitarioCompra * c.cantidad, 0);
    const gananciaNet = totalIngresos - totalCompras;
    const stockDisponible = stock.reduce((acc, s) => acc + Math.max(0, s.cantidadTotal), 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    const twoWeeksAgo = new Date(weekAgo);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 7);
    const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0];

    const ventasHoy = ventas
      .filter((v) => v.fecha === todayStr)
      .reduce((acc, v) => acc + v.precioUnitarioVenta * v.cantidad, 0);

    const ventasSemana = ventas
      .filter((v) => v.fecha >= weekAgoStr)
      .reduce((acc, v) => acc + v.precioUnitarioVenta * v.cantidad, 0);

    // Calculate previous week values for percentage comparison
    const ventasWeekBefore = ventas
      .filter((v) => v.fecha >= twoWeeksAgoStr && v.fecha < weekAgoStr)
      .reduce((acc, v) => acc + v.precioUnitarioVenta * v.cantidad, 0);

    const comprasWeekBefore = compras
      .filter((c) => c.createdAt && c.createdAt >= twoWeeksAgoStr && c.createdAt < weekAgoStr)
      .reduce((acc, c) => acc + c.precioUnitarioCompra * c.cantidad, 0);

    const gananciaWeekBefore = ventasWeekBefore - comprasWeekBefore;

    // Calculate percentage changes
    const ingresosPercentChange = ventasWeekBefore > 0 
      ? Math.round(((totalIngresos - ventasWeekBefore) / ventasWeekBefore) * 100)
      : 0;

    const gananciaPercentChange = gananciaWeekBefore > 0 
      ? Math.round(((gananciaNet - gananciaWeekBefore) / gananciaWeekBefore) * 100)
      : 0;

    return res.status(200).json({
      totalIngresos,
      totalCompras,
      gananciaNet,
      stockDisponible,
      ventasHoy,
      ventasSemana,
      ingresosPercentChange,
      gananciaPercentChange,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Dashboard charts endpoint
app.get('/api/dashboard/charts', async (req, res) => {
  try {
    const { type } = req.query;

    if (type === 'sales') {
      const ventasCollection = await getVentasCollection();
      const comprasCollection = await getComprasCollection();

      const ventas = await ventasCollection.find({}).toArray();
      const compras = await comprasCollection.find({}).toArray();

      const monthlyData = {};

      ventas.forEach((v) => {
        const month = v.fecha.substring(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = { ventas: 0, compras: 0 };
        }
        monthlyData[month].ventas += v.precioUnitarioVenta * v.cantidad;
      });

      compras.forEach((c) => {
        const month = c.fecha.substring(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = { ventas: 0, compras: 0 };
        }
        monthlyData[month].compras += c.precioUnitarioCompra * c.cantidad;
      });

      const chartData = Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
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
      const ventasCollection = await getVentasCollection();
      const ventas = await ventasCollection.find({}).toArray();

      const productSales = {};

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
      const ventasCollection = await getVentasCollection();
      const comprasCollection = await getComprasCollection();
      
      const ventas = await ventasCollection.find({}).toArray();
      const compras = await comprasCollection.find({}).toArray();

      const brandSales = {};

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

      const brandColors = {
        'ENA': 'hsl(217, 91%, 60%)',
        'Star': 'hsl(142, 71%, 45%)',
        'Body Advance': 'hsl(0, 84%, 60%)',
        'Gentech': 'hsl(217, 71%, 35%)',
        'GoldNutrition': 'hsl(45, 93%, 47%)',
        'Growsbar': 'hsl(0, 0%, 45%)',
        'Sin marca': 'hsl(0, 0%, 83%)',
      };

      const chartData = Object.entries(brandSales)
        .sort(([, a], [, b]) => b - a)
        .map(([name, value]) => ({
          name,
          value,
          fill: brandColors[name] || 'hsl(0, 0%, 50%)',
        }));

      return res.status(200).json(chartData);
    }

    if (type === 'payment-methods') {
      const ventasCollection = await getVentasCollection();
      const ventas = await ventasCollection.find({}).toArray();

      const paymentMethods = {};

      ventas.forEach((v) => {
        if (!paymentMethods[v.metodoPago]) {
          paymentMethods[v.metodoPago] = 0;
        }
        paymentMethods[v.metodoPago] += v.precioUnitarioVenta * v.cantidad;
      });

      const labels = {
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
      const ventasCollection = await getVentasCollection();
      const ventas = await ventasCollection.find({}).toArray();

      const clients = {};

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
    console.error('Get dashboard charts error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Dev server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api/*`);
});
