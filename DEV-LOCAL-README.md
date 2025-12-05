# 🚀 Desarrollo Local con Supabase - RogerBox

## ✅ Configuración Actual

- **Desarrollo Local**: Base de datos PostgreSQL en Docker
- **Puerto**: http://localhost:3001
- **Producción**: Pendiente (crear proyecto en Supabase cuando esté listo)
- **Costo actual**: $0 (solo local)

---

## 📋 Comandos Esenciales

### Iniciar Desarrollo Local

```bash
# 1. Asegúrate que Docker Desktop esté corriendo

# 2. Inicia RogerBox
start-rogerbox
```

### Detener Desarrollo Local

```bash
# Detener RogerBox
stop-rogerbox
```

---

## 🔑 URLs de Desarrollo

### Aplicación
- **RogerBox**: http://localhost:3001

### Supabase Local
- **Studio**: http://127.0.0.1:54323
- **API**: http://127.0.0.1:54321

---

## 🗄️ Base de Datos

### Resetear Base de Datos (con datos de prueba)
```bash
reset-rogerbox-db
```

Esto:
- Borra todos los datos
- Aplica el schema
- Ejecuta `supabase/seed.sql` (crea cursos, categorías, complementos)

### Ver Estado de Supabase
```bash
cd /Users/programamos.st/Documents/programamos-repos/rogerbox
supabase status
```

---

## 📊 Datos de Prueba Incluidos

Al hacer `reset-rogerbox-db` se crean automáticamente:

- **3 cursos** (Bootcamp 30 días, Yoga principiantes, Cardio HIIT)
- **5 categorías**
- **5 lecciones**
- **3 complementos**

---

## ⚠️ Importante: Verificar Ambiente

**SIEMPRE verifica que estés en local antes de hacer cambios:**

```bash
check-rogerbox
```

Debe mostrar:
```
✅ ESTÁS APUNTANDO A LOCAL (Docker)
   Los cambios NO afectarán producción
```

---

## 🔄 Variables de Entorno

### Archivos configurados:

- **`.env.local`** → Desarrollo local (Docker)
  ```
  NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
  ```

- **`.env.production`** → Producción (Supabase Cloud)
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://vzearvitzpwzscxhqfut.supabase.co
  ```

### Cambiar variables de entorno

**⚠️ IMPORTANTE:** Si cambias `.env.local`, debes reiniciar Next.js:

```bash
# Detén el servidor (Ctrl + C)
rm -rf .next         # Limpia el caché
npm run dev -p 3001  # Reinicia
```

---

## 🚀 Cuando Esté Listo para Producción

### Pasos para crear proyecto en Supabase:

1. **Crear nuevo proyecto** en tu organización programamos.st
2. **Aplicar migraciones:**
   ```bash
   supabase link --project-ref TU_PROJECT_REF
   supabase db push
   ```
3. **Actualizar `.env.production`** con las nuevas credenciales
4. **Deploy a Vercel** (o tu servicio)

**Costo**: $0 adicional (cabe en tu plan de $25/mes)

---

## 🎯 Workflow Recomendado

1. **Inicio del día:**
   ```bash
   # Abre Docker Desktop
   start-rogerbox
   ```

2. **Durante el día:**
   - Desarrolla normalmente
   - Crea datos de prueba según necesites
   - Si necesitas datos frescos: `reset-rogerbox-db`

3. **Fin del día:**
   ```bash
   # Opcional: detener Supabase para liberar recursos
   stop-rogerbox
   ```

---

## 💡 Correr Múltiples Proyectos

Puedes correr RogerBox y Zonat al mismo tiempo:

```bash
# Terminal 1
start-zonat      # http://localhost:3000

# Terminal 2
start-rogerbox   # http://localhost:3001
```

Ambos usan la misma instancia de Supabase local (Docker).

---

**¿Preguntas?** Revisa este archivo o ejecuta `check-rogerbox` para verificar tu ambiente.
