# ✅ Checklist de Deployment a Producción

## 📋 Pre-Deployment

### Supabase
- [ ] Proyecto de Supabase creado y activo
- [ ] Todas las tablas creadas (ejecutar scripts de migración si es necesario)
- [ ] Políticas RLS aplicadas (`scripts/rls-policies.sql`)
- [ ] Storage buckets configurados (si aplica)
- [ ] Usuario admin creado (`scripts/create-admin.js`)
- [ ] Credenciales de Supabase copiadas:
  - [ ] Project URL
  - [ ] Anon Key
  - [ ] Service Role Key (⚠️ SECRETO)

### Vercel
- [ ] Cuenta de Vercel creada
- [ ] Repositorio conectado a Vercel
- [ ] Build local funciona sin errores (`npm run build`)

### Variables de Entorno
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurada
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurada
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada (⚠️ NO pública)
- [ ] `NEXT_PUBLIC_ADMIN_USER_ID` configurada
- [ ] `NEXT_PUBLIC_ADMIN_EMAIL` configurada
- [ ] `NEXTAUTH_URL` configurada (si usas NextAuth)
- [ ] `NEXTAUTH_SECRET` configurada (si usas NextAuth)
- [ ] Variables de Wompi configuradas (si usas pagos)
- [ ] `WOMPI_ENVIRONMENT=production` (si usas pagos)
- [ ] `NEXT_PUBLIC_MOCK_PAYMENTS=false` (en producción)
- [ ] Variables de Mux configuradas (si usas videos)

## 🚀 Deployment

### Vercel
- [ ] Proyecto importado desde GitHub
- [ ] Framework: Next.js detectado correctamente
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `.next` (automático)
- [ ] Todas las variables de entorno agregadas
- [ ] Deploy inicial ejecutado
- [ ] Deploy completado sin errores

### Post-Deployment
- [ ] URL de producción accesible
- [ ] Login funciona correctamente
- [ ] Admin dashboard accesible
- [ ] Crear curso funciona
- [ ] Crear usuario funciona
- [ ] Pagos funcionan (si aplica)
- [ ] Videos se reproducen (si aplica)
- [ ] Imágenes se cargan correctamente

## 🔒 Seguridad

- [ ] `SUPABASE_SERVICE_ROLE_KEY` marcada como "Sensitive" en Vercel
- [ ] `WOMPI_PRIVATE_KEY` marcada como "Sensitive" en Vercel
- [ ] `NEXTAUTH_SECRET` marcada como "Sensitive" en Vercel
- [ ] Políticas RLS activas en Supabase
- [ ] No hay credenciales hardcodeadas en el código
- [ ] `.env` está en `.gitignore`

## 📊 Monitoreo

- [ ] Logs de Vercel accesibles
- [ ] Logs de Supabase accesibles
- [ ] Alertas configuradas (opcional)
- [ ] Analytics configurado (opcional)

## 🎯 Próximos Pasos

- [ ] Dominio personalizado configurado (opcional)
- [ ] SSL/HTTPS verificado (automático en Vercel)
- [ ] Backup de base de datos configurado en Supabase
- [ ] Documentación actualizada

---

**Nota:** Marca cada item conforme lo completes. Esto te ayudará a asegurar que nada se olvide durante el deployment.
