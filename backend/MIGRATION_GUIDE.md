# 📋 Guía de Migración: Sistema de Agendas de Médicos

## Resumen
Este documento describe cómo migrar de `horariosAtencion` (array en User) a `AgendaMedica` (colección de BD persistente).

## 🎯 Objetivo
Implementar un sistema de agendamiento robusto y persistente que reemplace la lógica frágil de horarios inline.

---

## 📦 Scripts Disponibles

### 1. **migrateAgenda.js**
Migra los `horariosAtencion` existentes a la colección `AgendaMedica`.

**Ubicación:** `backend/scripts/migrateAgenda.js`

**Qué hace:**
- Conecta a MongoDB
- Obtiene todos los médicos con `horariosAtencion`
- Convierte cada horario en un registro `AgendaMedica` con `tipo='fijo'`
- Mapea días: "Lunes" → 1, "Martes" → 2, etc.
- Marca cada médico como `agendaConfiguracion.tipo = 'nueva_agenda'`
- Registra el timestamp de migración en `agendaConfiguracion.migradoEl`

**Ejecución:**
```bash
node backend/scripts/migrateAgenda.js
```

**Salida esperada:**
```
============================================================
INICIANDO MIGRACIÓN: horariosAtencion → AgendaMedica
============================================================
✓ Conectado a MongoDB

[1/5] Migrando: Dr. Juan García (juan@integraSalud.com)
  ✓ 3 horario(s) migrado(s)

[2/5] Migrando: Dra. María López (maria@integraSalud.com)
  ✓ 2 horario(s) migrado(s)

...

============================================================
RESULTADO DE LA MIGRACIÓN
============================================================
Total de agendas creadas: 12
Médicos procesados correctamente: 5
Médicos con error: 0
============================================================
✓ MIGRACIÓN COMPLETADA SIN ERRORES!
```

**Código de salida:**
- `0` = Éxito
- `1` = Error(es) durante migración

---

### 2. **seedExcepciones.js**
Carga las excepciones iniciales (feriados, cierre de consultorio) en la colección `AgendaExcepcion`.

**Ubicación:** `backend/scripts/seedExcepciones.js`

**Qué hace:**
- Lee datos de `backend/seeds/excepciones-iniciales.json`
- Crea registros `AgendaExcepcion` para cada médico (si aplica a todos)
- Marca excepciones como `disponible: false` (no hay slots disponibles)

**Ejecución:**
```bash
node backend/scripts/seedExcepciones.js
```

**Salida esperada:**
```
============================================================
CARGANDO EXCEPCIONES INICIALES
============================================================
✓ Conectado a MongoDB

Encontradas 5 excepciones a cargar

Encontrados 5 médicos

Procesando excepción: feriado - 2026-05-01T00:00:00Z
  ✓ Creada para 5 médicos

...

============================================================
RESULTADO
============================================================
Excepciones creadas: 25
Errores: 0
============================================================
```

---

## 🔄 Proceso De Migración Completo

### Pre-Migración (Antes de ejecutar)

1. **Backup de BD:**
   ```bash
   mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/dbname" --out=./backup
   ```

2. **Verificar estado actual:**
   ```bash
   # Contar médicos con horariosAtencion
   db.users.countDocuments({ rol: "medico", horariosAtencion: { $exists: true, $ne: [] } })
   ```

### Migración (Pasos)

1. **Ejecutar migración de horarios:**
   ```bash
   cd backend
   node scripts/migrateAgenda.js
   ```
   → Verifica exit code: `echo $?`

2. **Cargar excepciones iniciales:**
   ```bash
   node scripts/seedExcepciones.js
   ```

3. **Validar migración (en MongoDB):**
   ```javascript
   // Contar agendas creadas
   db.agendamedicas.countDocuments()
   
   // Ver ejemplo de agenda migrada
   db.agendamedicas.findOne({ tipo: "fijo" })
   
   // Verificar médico marcado como migrado
   db.users.findOne({ rol: "medico" }, { agendaConfiguracion: 1 })
   ```

### Post-Migración (Después de ejecutar)

1. **Iniciar servidor backend:**
   ```bash
   npm start
   ```

2. **Probar endpoints:**
   ```bash
   # Obtener disponibilidad (sin autenticación)
   curl "http://localhost:5000/api/medicos/{medicoId}/disponibilidad?fecha=2026-03-25&duracion=30"
   
   # Obtener próximas fechas
   curl "http://localhost:5000/api/medicos/{medicoId}/proximas-fechas?dias=45"
   
   # Obtener agenda semanal
   curl "http://localhost:5000/api/medicos/{medicoId}/agenda/semanal"
   ```

3. **Tests de reprogramación:**
   - Abrir modal de reprogramar en frontend
   - Verificar que muestra slots reales (no "No atiende")
   - Confirmar reprogramación

---

## 🔙 Rollback (Si algo falla)

### Opción 1: Desde MongoDB (sin script)
```javascript
// Eliminar todas las agendas migradas
db.agendamedicas.deleteMany({ razon: "Migración desde horariosAtencion" })

// Resetear agendaConfiguracion
db.users.updateMany(
  { rol: "medico" },
  { $set: { "agendaConfiguracion.tipo": "legacy" } }
)
```

### Opción 2: Desde backup
```bash
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/dbname" ./backup
```

---

## 📊 Verificación De Datos

### Consultas útiles en MongoDB

**Ver agenda de un médico:**
```javascript
db.agendamedicas.find({ medico: ObjectId("...") })
```

**Ver excepciones de un médico:**
```javascript
db.agendaexcepcions.find({ 
  medico: ObjectId("..."),
  fecha: { $gte: new Date("2026-04-01"), $lte: new Date("2026-05-31") }
})
```

**Comparar horariosAtencion vs AgendaMedica:**
```javascript
// horariosAtencion (legacy)
db.users.findOne({ rol: "medico" }, { horariosAtencion: 1 })

// AgendaMedica (nuevo)
db.agendamedicas.find({ medico: ObjectId("...") })
```

---

## ⚠️ Notas Importantes

- ✅ **Compatibilidad hacia atrás:** Campo `horariosAtencion` se mantiene intacto
- ✅ **Sin downtime:** Puedes ejecutar migración mientras sistema está en uso
- ⚠️ **Duración:** Migración rápida (~segundos para 10-20 médicos)
- ⚠️ **Errores no críticos:** Si un médico falla, se registra pero continúa
- 🔄 **Idempotencia:** Ejecutar script 2 veces = mismo resultado (no duplica)

---

## 📞 Soporte

Si hay errores durante migración:
1. Revisar console output
2. Verificar conexión a MongoDB
3. Validar permisos en BD
4. Hacer rollback si es necesario
5. Revisar logs de backend

---

**Fecha de esta guía:** Marzo 2026  
**Versión:** 1.0  
**Estado:** Pendiente de testing en FASE 6
