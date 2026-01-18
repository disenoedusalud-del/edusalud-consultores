# 🚀 Desplegar MASTER_HASH con Functions v2

**Fecha:** 2025-12-05  
**Estado:** ✅ Código actualizado a Functions v2

---

## ✅ Cambios Realizados

El código de `functions/index.js` ha sido actualizado para usar **Firebase Functions v2** con `defineString`:

1. ✅ Import agregado: `const { defineString } = require('firebase-functions/params');`
2. ✅ Parámetro definido: `masterHashParam` con valor por defecto
3. ✅ Función convertida: `validateMasterCodeHTTP` ahora usa `onRequest` de v2

---

## 📋 Pasos para Desplegar

### Paso 1: Desplegar la Función

Ejecuta desde la terminal:

```bash
firebase deploy --only functions:validateMasterCodeHTTP
```

### Paso 2: Configurar el Parámetro

Durante el deploy, Firebase CLI te pedirá configurar el parámetro `MASTER_HASH`. 

**Opción A: Durante el deploy (interactivo)**
- Cuando te pregunte, ingresa: `7d61f670561642f08322ad4860c28ba207b55e8d8158242f459f2017d4c1cfc8`

**Opción B: Configurar antes del deploy**
```bash
firebase functions:secrets:set MASTER_HASH
```
- Te pedirá el valor interactivamente
- Ingresa: `7d61f670561642f08322ad4860c28ba207b55e8d8158242f459f2017d4c1cfc8`

### Paso 3: Verificar

1. Prueba el login con código master: `EDUMASTER123456987`
2. Revisa los logs en Firebase Console → Functions → validateMasterCodeHTTP → Logs
3. Deberías ver: `[MASTER] ✅ Código master válido (hash)` (sin warnings)

---

## 🔍 Valor del Hash

```
MASTER_HASH = 7d61f670561642f08322ad4860c28ba207b55e8d8158242f459f2017d4c1cfc8
```

Este es el hash SHA-256 del código master: `EDUMASTER123456987`

---

## ⚠️ Notas Importantes

- El `default` en `defineString` es solo para desarrollo local
- En producción, **debes configurar el valor** durante el deploy o con `firebase functions:secrets:set`
- Si no configuras el valor, usará el `default` (que es seguro, pero es mejor configurarlo explícitamente)

---

## 🐛 Troubleshooting

### Error: "Parameter MASTER_HASH not found"
- **Solución:** Configura el parámetro con `firebase functions:secrets:set MASTER_HASH`

### Error: "defineString is not a function"
- **Solución:** Verifica que `firebase-functions` esté actualizado: `npm install firebase-functions@latest`

### La función no toma el valor configurado
- **Solución:** Redesplegar después de configurar: `firebase deploy --only functions:validateMasterCodeHTTP`

---

**Última actualización:** 2025-12-05

