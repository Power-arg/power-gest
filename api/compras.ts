import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getComprasCollection, getVentasCollection, getStockCollection, updateStockAfterCompra, revertStockAfterDeleteCompra, adjustStockAfterUpdateCompra, CompraDB } from '../src/lib/mongodb/models.js';
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
    const comprasCollection = await getComprasCollection();

    // GET all compras
    if (req.method === 'GET') {
      const compras = await comprasCollection.find({}).sort({ createdAt: -1 }).toArray();
      const formatted = compras.map((c) => ({
        id: c._id!.toString(),
        producto: c.producto,
        proveedor: c.proveedor,
        marca: c.marca,
        precioUnitarioCompra: c.precioUnitarioCompra,
        cantidad: c.cantidad,
        fecha: c.fecha,
      }));
      return res.status(200).json(formatted);
    }

    // POST create compra
    if (req.method === 'POST') {
      const { producto, proveedor, marca, precioUnitarioCompra, cantidad, fecha } = req.body;

      if (!producto || !proveedor || !marca || !precioUnitarioCompra || !cantidad || !fecha) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const newCompra: CompraDB = {
        producto,
        proveedor,
        marca,
        precioUnitarioCompra: parseFloat(precioUnitarioCompra),
        cantidad: parseInt(cantidad),
        fecha,
        createdAt: new Date(),
      };

      const result = await comprasCollection.insertOne(newCompra);
      
      // Update stock
      await updateStockAfterCompra(producto, proveedor, parseInt(cantidad));

      return res.status(201).json({
        id: result.insertedId.toString(),
        ...newCompra,
      });
    }

    // PUT update compra
    if (req.method === 'PUT') {
      const { id, producto, proveedor, marca, precioUnitarioCompra, cantidad, fecha } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }

      // Check if this product-provider has sales
      const ventasCollection = await getVentasCollection();
      const hasSales = await ventasCollection.findOne({ producto, proveedor });

      if (hasSales) {
        return res.status(400).json({ 
          error: 'No se puede editar una compra de un producto-proveedor con ventas registradas' 
        });
      }

      const existingCompra = await comprasCollection.findOne({ _id: new ObjectId(id) });
      
      if (!existingCompra) {
        return res.status(404).json({ error: 'Compra not found' });
      }

      const updatedCompra = {
        producto: producto || existingCompra.producto,
        proveedor: proveedor || existingCompra.proveedor,
        marca: marca || existingCompra.marca,
        precioUnitarioCompra: precioUnitarioCompra !== undefined 
          ? parseFloat(precioUnitarioCompra) 
          : existingCompra.precioUnitarioCompra,
        cantidad: cantidad !== undefined ? parseInt(cantidad) : existingCompra.cantidad,
        fecha: fecha || existingCompra.fecha,
      };

      await comprasCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedCompra }
      );

      // Adjust stock if quantity changed
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
    }

    // DELETE compra
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'ID is required' });
      }

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
      
      // Revert stock
      await revertStockAfterDeleteCompra(compra.producto, compra.proveedor, compra.cantidad);

      return res.status(200).json({ message: 'Compra deleted' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Compras API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
