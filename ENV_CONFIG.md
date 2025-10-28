# 🔐 Configuración de Variables de Entorno

## 📋 Variables Requeridas

### `BEARER_TOKEN`
Token de autenticación para la API de Lote Móvil.

---

## 🛠️ Configuración Local (Desarrollo)

1. **Copiar el archivo de ejemplo:**
   ```bash
   cp .env.example .env.local
   ```

2. **Editar `.env.local`** y agregar el token real.

3. **Reiniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

---

## ☁️ Configuración en Vercel (Producción)

### Opción 1: Desde el Dashboard

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Settings → Environment Variables
3. Agregar nueva variable:
   - **Key:** `BEARER_TOKEN`
   - **Value:** (pegar el token)
   - **Environments:** Production, Preview, Development
4. Save
5. Redeploy el proyecto para que tome efecto

### Opción 2: Desde la CLI

```bash
vercel env add BEARER_TOKEN
# Pegar el valor del token cuando lo solicite
# Seleccionar: Production, Preview, Development
```

---

## ✅ Verificar Configuración

### Local:
```bash
# La variable debe estar disponible
echo $BEARER_TOKEN  # Mac/Linux
echo %BEARER_TOKEN%  # Windows CMD
```

### Vercel:
```bash
vercel env ls
```

Deberías ver:
```
Environment Variables
┌─────────────┬──────────────────┬───────────────┐
│ Name        │ Value (Preview)  │ Environments  │
├─────────────┼──────────────────┼───────────────┤
│ BEARER_TOKEN│ eyJ0eXAiOiJ...   │ Production... │
└─────────────┴──────────────────┴───────────────┘
```

---

## 🔒 Seguridad

- ✅ `.env.local` está en `.gitignore` - **NO se sube a git**
- ✅ El token está solo en el backend (función serverless)
- ✅ El frontend NO tiene acceso al token
- ✅ Rate limiting implementado (50 req/hora por IP)
- ✅ Caché de 24 horas para reducir llamadas

---

## 🚨 Problemas Comunes

### Error: "BEARER_TOKEN is not defined"

**Solución:**
1. Verificar que `.env.local` existe
2. Verificar que la variable no tiene espacios extras
3. Reiniciar el servidor de desarrollo

### Error 401 en producción

**Solución:**
1. Verificar que la variable está configurada en Vercel
2. Hacer un nuevo deploy después de agregar la variable
3. Verificar que el token no haya expirado

---

## 📞 Soporte

Si el token expira o necesitas uno nuevo, contactar al administrador de la API de Lote Móvil.
