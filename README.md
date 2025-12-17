# Power Gest - Sistema de Gestión de Inventario

Sistema completo de gestión de inventario con frontend en React/TypeScript y backend con MongoDB.

## 🚀 Inicio Rápido
1. Crea `.env.local` con tu `MONGODB_URI` de MongoDB Atlas
2. Ejecuta `npm install`
3. Ejecuta `npm run init-password` (solo una vez)
4. Ejecuta `npm run dev`
5. Abre http://localhost:8080
6. Login con contraseña: `power2024`

## 📋 Características

- ✅ **Autenticación** con contraseña hasheada (bcrypt)
- ✅ **Gestión de Compras** con validaciones y selección de productos existentes
- ✅ **Gestión de Ventas** con control automático de stock
- ✅ **Inventario** con actualización en tiempo real
- ✅ **Dashboard** con gráficos y estadísticas
- ✅ **Responsive** para desktop y móvil
- ✅ **Deploy** listo para Vercel con MongoDB Atlas

## 🛠️ Tecnologías

- **Frontend:** React 18, TypeScript, Vite, TailwindCSS, Shadcn/ui, Recharts
- **Backend Dev:** Express + MongoDB
- **Backend Prod:** Vercel Serverless Functions
- **Base de Datos:** MongoDB Atlas
- **Autenticación:** bcryptjs

## 📁 Estructura del Proyecto

```
power-gest/
├── api/ # API routes para Vercel (producción)
├── src/ # Frontend React
│   ├── components/ # Componentes reutilizables
│   ├── pages/ # Páginas de la aplicación
│   ├── lib/ # Utilidades y configuración
│   └── types/ # Tipos TypeScript
├── scripts/ # Scripts de utilidad
├── server.mjs # Servidor de desarrollo local
├── .env.local # Variables de entorno (NO committear)
```

## 🔐 Seguridad

- Contraseñas hasheadas con bcrypt (10 rounds)
- Variables de entorno para credenciales sensibles
- CORS configurado correctamente
- Validaciones en frontend y backend
