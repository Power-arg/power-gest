import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getVentasCollection,
  getStockCollection,
  updateStockAfterVenta,
  revertStockAfterDeleteVenta,
  adjustStockAfterUpdateVenta,
  VentaDB,
} from '../src/lib/mongodb/models.js';
import { ObjectId } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const ventasCollection = await getVentasCollection();

    // GET all ventas
    if (req.method === 'GET') {
      const ventas = await ventasCollection.find({}).sort({ createdAt: -1 }).toArray();
      const formatted = ventas.map((v) => ({
        id: v._id!.toString(),
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
    }

    // POST create venta
    if (req.method === 'POST') {
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

      // Check if stock exists and has enough quantity
      const stockCollection = await getStockCollection();
      const stock = await stockCollection.findOne({ producto, proveedor });

      if (!stock) {
        return res.status(400).json({ 
          error: 'No existe stock para este producto-proveedor' 
        });
      }

      if (stock.cantidadTotal < parseInt(cantidad)) {
        return res.status(400).json({ 
          error: `Stock insuficiente. Disponible: ${stock.cantidadTotal}` 
        });
      }

      const newVenta: VentaDB = {
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

      // Update stock
      await updateStockAfterVenta(
        producto,
        proveedor,
        parseInt(cantidad),
        parseFloat(precioUnitarioVenta)
      );

      return res.status(201).json({
        id: result.insertedId.toString(),
        ...newVenta,
      });
    }

    // PUT update venta
    if (req.method === 'PUT') {
      const {
        id,
        precioUnitarioVenta,
        cantidad,
        cliente,
        metodoPago,
        isPagado,
        usuarioACargo,
        fecha,
      } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }

      const existingVenta = await ventasCollection.findOne({ _id: new ObjectId(id) });

      if (!existingVenta) {
        return res.status(404).json({ error: 'Venta not found' });
      }

      // Check stock availability if quantity is increasing
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
        precioUnitarioVenta: precioUnitarioVenta !== undefined
          ? parseFloat(precioUnitarioVenta)
          : existingVenta.precioUnitarioVenta,
        cantidad: cantidad !== undefined ? parseInt(cantidad) : existingVenta.cantidad,
        cliente: cliente || existingVenta.cliente,
        metodoPago: metodoPago || existingVenta.metodoPago,
        isPagado: isPagado !== undefined 
          ? (isPagado === true || isPagado === 'true') 
          : existingVenta.isPagado,
        usuarioACargo: usuarioACargo || existingVenta.usuarioACargo,
        fecha: fecha || existingVenta.fecha,
      };

      await ventasCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedVenta }
      );

      // Adjust stock if quantity or price changed
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
    }

    // DELETE venta
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'ID is required' });
      }

      const venta = await ventasCollection.findOne({ _id: new ObjectId(id) });

      if (!venta) {
        return res.status(404).json({ error: 'Venta not found' });
      }

      await ventasCollection.deleteOne({ _id: new ObjectId(id) });

      // Revert stock
      await revertStockAfterDeleteVenta(venta.producto, venta.proveedor, venta.cantidad);

      return res.status(200).json({ message: 'Venta deleted' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Ventas API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
