<h1 align="center">PowerGest - Sistema de Gestión de Inventario</h1>

Sistema integral de gestión de inventario, compras y ventas con interfaz moderna y backend escalable. Diseñado para empresas que requieren control precisión de stock en tiempo real y análisis de operaciones.

## ✨ Características Principales

- **🔐 Autenticación Segura** - Contraseñas hasheadas con bcrypt (10 rounds)
- **📦 Gestión de Inventario** - Control de stock en tiempo real con historiales
- **🛒 Gestión de Compras** - Registro de compras con validaciones y selección de productos
- **💰 Gestión de Ventas** - Control automático de stock con auditoría de transacciones
- **📊 Dashboard Analítico** - Gráficos y estadísticas en tiempo real
- **📱 Diseño Responsive** - Completamente optimizado para desktop y móvil
- **☁️ Deploy en Producción** - Listo para Vercel con MongoDB Atlas

## 🚀 Inicio Rápido

### Requisitos Previos
- Node.js 18+ 
- npm o yarn
- Cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (base de datos gratuita)

### Instalación y Configuración
```bash
# Clonar proyecto
git clone <repo>
cd power-gest

# Instalar dependencias
npm install

# Configurar variables de entorno
En archivo .env: mongodb+srv://username:password@cluster.mongodb.net/powergest?retryWrites=true&w=majority
--> Obtén tu `MONGODB_URI` desde MongoDB Atlas (Connect > Drivers > Node.js)

# Setear contraseña
1. Edita el archivo [scripts/init-password.ts]
2. Cambia la línea: const plainPassword = 'TuPassword123'; por tu contraseña deseada
## Inicializar la contraseña de admin
npm run init-password

# Iniciar ambiente de desarrollo
npm run dev

# La aplicación estará disponible en http://localhost:8080
```

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, Shadcn/ui |
| **Visualización** | Recharts para gráficos analíticos |
| **Backend Desarrollo** | Express.js + MongoDB |
| **Backend Producción** | Vercel Serverless Functions |
| **Base de Datos** | MongoDB Atlas (cloud) |
| **Autenticación** | bcryptjs (hashing seguro) |
| **Build Tool** | Vite (desarrollo rápido) |

## 📁 Estructura del Proyecto

```
power-gest/
├── api/                    # API routes para Vercel (producción)
│   ├── auth.ts            # Autenticación y validación
│   ├── compras.ts         # Gestión de compras
│   ├── ventas.ts          # Gestión de ventas
│   ├── productos.ts       # CRUD de productos
│   ├── stock.ts           # Control de inventario
│   └── dashboard/         # Endpoints analíticos
├── src/                    # Aplicación frontend React
│   ├── components/        # Componentes reutilizables
│   │   ├── admin/        # Componentes administrativos
│   │   └── ui/           # Componentes de interfaz (Shadcn)
│   ├── pages/            # Páginas principales
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Funciones y configuración
│   │   └── mongodb/      # Cliente MongoDB
│   ├── types/            # Definiciones TypeScript
│   └── assets/           # Imágenes y recursos estáticos
├── scripts/               # Utilidades CLI
│   └── init-password.ts  # Inicialización de contraseña (IMPORTANTE)
├── server.mjs             # Servidor Express de desarrollo
├── .env.local             # Variables de entorno (NO committear)
├── vite.config.ts         # Configuración de Vite
└── tailwind.config.ts     # Configuración de Tailwind CSS
```

## 🔐 Seguridad

| Aspecto | Implementación |
|--------|----------------|
| **Contraseñas** | Hasheadas con bcrypt (10 rounds) |
| **Variables sensibles** | Almacenadas en `.env.local` |
| **CORS** | Configurado según origen del cliente |
| **Validaciones** | Frontend y backend (defensa en profundidad) |
| **Base de datos** | MongoDB Atlas con autenticación |

## 📝 Comandos Disponibles

```bash
npm run dev              # Iniciar servidor + cliente en paralelo
npm run dev:server       # Solo servidor Express
npm run dev:client       # Solo cliente Vite
npm run build            # Compilar para producción
npm run init-password    # Inicializar/resetear contraseña de admin
npm run lint             # Verificar código con ESLint
npm run preview          # Vista previa producción localmente
```

## 🚢 Deploy a Producción (Vercel)

1. **Conectar repositorio a Vercel**
   - Ir a [vercel.com](https://vercel.com)
   - Conectar tu repositorio Git
   - Configurar variables de entorno

2. **Configurar variables de entorno en Vercel**
   - `MONGODB_URI = tu-connection-string-de-mongodb`

3. **Deploy automático**
   - Cada push a la rama principal desplegará automáticamente

Ver [vercel.json](vercel.json) para configuración del proyecto

---

<h3 align="center">Última actualización: Marzo 2026 </h3>
