# Guía de Deployment a Producción

## 🚀 Preparación para Vercel y Supabase

### 1. Configuración de Supabase en Producción

#### Obtener las credenciales de Supabase:
1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **Settings** → **API**
3. Copia los siguientes valores:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ MANTÉN ESTA SECRETA)

#### Aplicar políticas RLS:
1. Ve a **SQL Editor** en Supabase
2. Ejecuta el script `scripts/rls-policies.sql` para configurar las políticas de seguridad

#### Configurar Storage (si usas imágenes):
1. Ve a **Storage** en Supabase
2. Crea los buckets necesarios (ej: `course-images`, `profiles`)
3. Configura las políticas de acceso según necesites

### 2. Configuración de Variables de Entorno en Vercel

#### Variables Requeridas:

**Supabase:**
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

**Admin:**
```
NEXT_PUBLIC_ADMIN_USER_ID=tu_user_id_de_admin
NEXT_PUBLIC_ADMIN_EMAIL=rogerbox@admin.com
```

**NextAuth (si usas):**
```
NEXTAUTH_URL=https://tu-app.vercel.app
NEXTAUTH_SECRET=genera_un_secreto_seguro_aqui
```

**Wompi (Pagos):**
```
WOMPI_PUBLIC_KEY=tu_wompi_public_key
WOMPI_PRIVATE_KEY=tu_wompi_private_key
WOMPI_INTEGRITY_KEY=tu_wompi_integrity_key
WOMPI_ENVIRONMENT=production
NEXT_PUBLIC_MOCK_PAYMENTS=false
```

**Mux (Videos):**
```
NEXT_PUBLIC_MUX_TOKEN_ID=tu_mux_token_id
NEXT_PUBLIC_MUX_PLAYBACK_ID=tu_mux_playback_id
NEXT_PUBLIC_MUX_DATA_ENV_KEY=tu_mux_data_env_key
```

### 3. Pasos para Deploy en Vercel

#### Opción A: Desde GitHub (Recomendado)
1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Click en **Add New Project**
3. Importa tu repositorio de GitHub
4. Configura:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (raíz del proyecto)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. Agrega todas las variables de entorno listadas arriba
6. Click en **Deploy**

#### Opción B: Desde CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Para producción
vercel --prod
```

### 4. Configuración Post-Deploy

#### Verificar que todo funciona:
1. Visita tu URL de Vercel (ej: `https://tu-app.vercel.app`)
2. Verifica que puedes iniciar sesión
3. Verifica que el admin dashboard funciona
4. Prueba crear un curso/usuario
5. Verifica que los pagos funcionan (si aplica)

#### Configurar Dominio Personalizado (Opcional):
1. En Vercel Dashboard → **Settings** → **Domains**
2. Agrega tu dominio personalizado
3. Configura los DNS según las instrucciones de Vercel

### 5. Checklist Pre-Deploy

- [ ] Todas las variables de entorno están configuradas en Vercel
- [ ] Las políticas RLS están aplicadas en Supabase
- [ ] El usuario admin existe en Supabase (ejecutar `scripts/create-admin.js` si es necesario)
- [ ] Las tablas necesarias están creadas en Supabase
- [ ] Storage buckets están configurados (si aplica)
- [ ] `NEXT_PUBLIC_MOCK_PAYMENTS=false` en producción
- [ ] `WOMPI_ENVIRONMENT=production` en producción
- [ ] El build local funciona sin errores (`npm run build`)

### 6. Troubleshooting

#### Error: "Missing required Supabase environment variables"
- Verifica que todas las variables de Supabase estén configuradas en Vercel
- Asegúrate de que no tengan espacios extra al inicio/final

#### Error: "Cannot use localhost"
- Verifica que `NEXT_PUBLIC_SUPABASE_URL` apunte a tu proyecto de Supabase en producción
- No debe contener `127.0.0.1` o `localhost`

#### Error: "RLS Policy Error"
- Ejecuta el script `scripts/rls-policies.sql` en Supabase SQL Editor
- Verifica que todas las tablas existan

#### Build falla en Vercel
- Revisa los logs de build en Vercel Dashboard
- Verifica que todas las dependencias estén en `package.json`
- Asegúrate de que `node` y `npm` versiones sean compatibles

### 7. Monitoreo Post-Deploy

- Revisa los logs en Vercel Dashboard → **Deployments** → **Functions**
- Monitorea errores en Supabase Dashboard → **Logs**
- Configura alertas en Vercel para errores críticos

### 8. Scripts Útiles para Producción

```bash
# Verificar variables de entorno
node scripts/check-env.js

# Crear usuario admin (ejecutar en Supabase SQL Editor o localmente con variables de prod)
node scripts/create-admin.js

# Verificar base de datos
node scripts/verify-database.js
```

---

## 📝 Notas Importantes

1. **NUNCA** commitees el archivo `.env` o `.env.local` al repositorio
2. **SIEMPRE** usa `SUPABASE_SERVICE_ROLE_KEY` como variable de entorno (no pública)
3. En producción, `NEXT_PUBLIC_MOCK_PAYMENTS` debe ser `false`
4. Las políticas RLS son críticas para la seguridad - no las omitas
5. Mantén backups regulares de tu base de datos en Supabase


# ============================================
# VARIABLES DE ENTORNO PARA VERCEL
# ============================================
# ⚠️ IMPORTANTE: Estas claves son sensibles. NO las compartas públicamente.
# ============================================

NEXT_PUBLIC_SUPABASE_URL=https://lrwiyqodwzqdlzkczvge.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_iy7prMijl6-WfPXQW6kSHg_Clwtt650
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxyd2l5cW9kd3pxZGx6a2N6dmdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTIwNTk5NCwiZXhwIjoyMDg0NzgxOTk0fQ.rrUiT6t4xBwG6LOlQyFmmvPCGtv_acixv82v0twCa9A
NEXT_PUBLIC_ADMIN_USER_ID=8baaa101-ddcc-482c-a409-1ed9b9fac093
NEXT_PUBLIC_ADMIN_EMAIL=rogerbox@admin.com
NEXT_PUBLIC_MOCK_PAYMENTS=false
NODE_ENV=production