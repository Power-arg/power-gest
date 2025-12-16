import type { VercelRequest, VercelResponse } from '@vercel/node';

const SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL!;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const { method } = req;

    // GET - Obtener todas las ventas
    if (method === 'GET') {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getVentas',
        }),
      });

      const text = await response.text();
      const data = JSON.parse(text);

      if (data.error) {
        return res.status(500).json({ success: false, error: data.error });
      }

      return res.status(200).json({
        success: true,
        data: Array.isArray(data) ? data : [],
      });
    }

    // POST - Crear nueva venta
    if (method === 'POST') {
      const venta = req.body;

      if (!venta.producto || !venta.proveedor || !venta.precioUnitarioVenta || 
          !venta.cantidad || !venta.cliente || !venta.metodoPago || 
          !venta.usuarioACargo || !venta.fecha) {
        return res.status(400).json({ success: false, error: 'Datos incompletos' });
      }

      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createVenta',
          ...venta,
        }),
      });

      const text = await response.text();
      const data = JSON.parse(text);

      if (data.error) {
        return res.status(500).json({ success: false, error: data.error });
      }

      return res.status(201).json({
        success: true,
        data: { id: data.id, ...venta },
      });
    }

    // PUT - Actualizar venta existente
    if (method === 'PUT') {
      const venta = req.body;

      if (!venta.id) {
        return res.status(400).json({ success: false, error: 'ID requerido' });
      }

      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateVenta',
          ...venta,
        }),
      });

      const text = await response.text();
      const data = JSON.parse(text);

      if (data.error) {
        return res.status(500).json({ success: false, error: data.error });
      }

      return res.status(200).json({
        success: true,
        data: venta,
      });
    }

    // DELETE - Eliminar venta
    if (method === 'DELETE') {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requerido' });
      }

      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteVenta',
          id,
        }),
      });

      const text = await response.text();
      const data = JSON.parse(text);

      if (data.error) {
        return res.status(500).json({ success: false, error: data.error });
      }

      return res.status(200).json({
        success: true,
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('VENTAS ERROR:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}