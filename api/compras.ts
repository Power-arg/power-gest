import type { VercelRequest, VercelResponse } from '@vercel/node';

const SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL!;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const { method } = req;

    // GET - Obtener todas las compras
    if (method === 'GET') {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getCompras',
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

    // POST - Crear nueva compra
    if (method === 'POST') {
      const compra = req.body;

      if (!compra.producto || !compra.proveedor || !compra.precioUnitarioCompra || !compra.cantidad || !compra.fecha) {
        return res.status(400).json({ success: false, error: 'Datos incompletos' });
      }

      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createCompra',
          ...compra,
        }),
      });

      const text = await response.text();
      const data = JSON.parse(text);

      if (data.error) {
        return res.status(500).json({ success: false, error: data.error });
      }

      return res.status(201).json({
        success: true,
        data: { id: data.id, ...compra },
      });
    }

    // PUT - Actualizar compra existente
    if (method === 'PUT') {
      const compra = req.body;

      if (!compra.id) {
        return res.status(400).json({ success: false, error: 'ID requerido' });
      }

      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateCompra',
          ...compra,
        }),
      });

      const text = await response.text();
      const data = JSON.parse(text);

      if (data.error) {
        return res.status(500).json({ success: false, error: data.error });
      }

      return res.status(200).json({
        success: true,
        data: compra,
      });
    }

    // DELETE - Eliminar compra
    if (method === 'DELETE') {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ success: false, error: 'ID requerido' });
      }

      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteCompra',
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
    console.error('COMPRAS ERROR:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}