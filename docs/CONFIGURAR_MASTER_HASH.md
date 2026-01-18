# 🔐 Configurar Variable de Entorno MASTER_HASH

## Método 1: Firebase Console (Recomendado) ✅

### Pasos:

1. **Abre Firebase Console:**
   - Ve a: https://console.firebase.google.com/project/edusalud-platfor

2. **Navega a Functions:**
   - En el menú lateral izquierdo, haz clic en **"Functions"** (o "Funciones")

3. **Ve a Configuration:**
   - Haz clic en la pestaña **"Configuration"** (o "Configuración")
   - O busca el botón **"Environment variables"** / **"Variables de entorno"**

4. **Agrega la variable:**
   - Haz clic en **"Add variable"** / **"Agregar variable"**
   - **Nombre:** `MASTER_HASH`
   - **Valor:** `7d61f670561642f08322ad4860c28ba207b55e8d8158242f459f2017d4c1cfc8`
   - Haz clic en **"Save"** / **"Guardar"**

5. **Redesplegar la función (opcional pero recomendado):**
   ```bash
   firebase deploy --only functions:validateMasterCodeHTTP
   ```

---

## Método 2: Usando Terminal (gcloud CLI)

Si tienes `gcloud` CLI instalado y configurado:

```bash
# Configurar la variable de entorno
gcloud functions deploy validateMasterCodeHTTP \
  --gen2 \
  --runtime nodejs22 \
  --region us-central1 \
  --source functions \
  --entry-point validateMasterCodeHTTP \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars MASTER_HASH=7d61f670561642f08322ad4860c28ba207b55e8d8158242f459f2017d4c1cfc8
```

---

## Método 3: Archivo .env (Solo para desarrollo local)

Si quieres probar localmente, crea un archivo `.env` en la carpeta `functions/`:

```bash
# functions/.env
MASTER_HASH=7d61f670561642f08322ad4860c28ba207b55e8d8158242f459f2017d4c1cfc8
```

**⚠️ Nota:** Este método solo funciona para desarrollo local con `firebase emulators:start`. Para producción, usa el Método 1.

---

## ✅ Verificar que funciona:

1. Después de configurar, prueba el login con código master: `EDUMASTER123456987`
2. Revisa los logs de la función en Firebase Console > Functions > validateMasterCodeHTTP > Logs
3. Deberías ver: `[MASTER] ✅ Código master válido` (sin el warning de fallback)

---

## 🔒 Seguridad:

- La variable de entorno está almacenada de forma segura en Firebase
- No se expone en el código del cliente
- Solo la función del servidor puede acceder a ella

