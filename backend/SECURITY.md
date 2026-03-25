# 🔒 Documentación De Seguridad - Sistema de Agendamiento

## Medidas Implementadas

### 1. Autenticación (Middleware `auth.js`)
- ✅ Token JWT requerido en todas las rutas protegidas
- ✅ Validación de firma JWT con `JWT_SECRET`
- ✅ Extracción del usuario desde el token en `req.user`
- ✅ Rechazo automático si token no existe o es inválido

**Error 401:** Se retorna si no hay token o es inválido

---

### 2. Autorización - Rutas Públicas
Los siguientes endpoints **NO requieren autenticación** (por diseño):
```
GET /api/medicos/:id/disponibilidad
GET /api/medicos/:id/proximas-fechas
GET /api/medicos/:id/agenda/semanal
```

**Razón:** Necesarios para que pacientes sin autenticación vean horarios disponibles

---

### 3. Autorización - Middleware `agendaAuth.js`
Creado dos middlewares de autorización a nivel de recurso:

#### a) `agendaOwnerOrAdmin` (Usado en POST/DELETE)
Valida que el usuario sea:
- ✅ Admin (puede acceder a todas las agendas), O
- ✅ El médico propietario (acceso solo a su propia agenda)

**Error 403:** Se retorna si intenta modificar agenda de otro médico

#### b) `medicoOrAdmin` (Usado en GET excepciones)
Valida que el usuario sea:
- ✅ Médico O Admin

**Nota:** Los médicos solo ven sus propias excepciones (validado en controller)

---

### 4. Validaciones en Routes (`agendaMedicos.js`)
- ✅ express-validator para validar tipos de datos
- ✅ Rango de días: 0-6 (Domingo a Sábado)
- ✅ Formato hora: HH:mm con regex
- ✅ Tipos de excepción: lista whitelist
- ✅ MongoDB IDs válidos

**Todas las validaciones ejecutadas ANTES del controller**

---

### 5. Validaciones en Controller (`agendaMedicaController.js`)
- ✅ Verificación de que el médico existe y tiene rol='medico'
- ✅ Arrays no vacíos
- ✅ Ranges de horarios válidos
- ✅ Médicos solo ven sus propias excepciones

---

### 6. Model Validations (`AgendaMedica.js`, `AgendaExcepcion.js`)
- ✅ Referencias a User con validación de rol='medico'
- ✅ Pre-hooks que validan estructura según tipo (fijo vs excepción)
- ✅ Validaciones de formato hora (HH:mm)
- ✅ Enum para tipos seguros

---

## Matriz De Control De Acceso

| Endpoint | Método | Rol Requerido | Restricción Adicional | Público |
|----------|--------|---------------|------------------------|---------|
| `/medicos/:id/disponibilidad` | GET | - | - | ✅ SÍ |
| `/medicos/:id/proximas-fechas` | GET | - | - | ✅ SÍ |
| `/medicos/:id/agenda/semanal` | GET | - | - | ✅ SÍ |
| `/medicos/:id/agenda` | POST | Admin/Médico | Dueño o Admin | ❌ NO |
| `/medicos/:id/agenda/:dia` | DELETE | Admin/Médico | Dueño o Admin | ❌ NO |
| `/medicos/:id/excepciones` | POST | Admin/Médico | Dueño o Admin | ❌ NO |
| `/medicos/:id/excepciones` | GET | Admin/Médico | Ver solo propias si médico | ❌ NO |
| `/medicos/:id/excepciones/:id` | DELETE | Admin/Médico | Dueño o Admin | ❌ NO |

---

## Casos De Uso Bloqueados ✅

### 1. Paciente intenta crear agenda
```bash
POST /api/medicos/{medicoId}/agenda
Authorization: Bearer {pacienteToken}
→ 403 "Solo médicos y admins pueden gestionar agendas"
```

### 2. Médico intenta modificar agenda de otro médico
```bash
POST /api/medicos/{otroMedicoId}/agenda
Authorization: Bearer {miToken}
→ 403 "No puedes modificar la agenda de otro médico"
```

### 3. Usuario sin token intenta crear excepción
```bash
POST /api/medicos/{medicoId}/excepciones
(sin header Authorization)
→ 401 "No token"
```

### 4. Médico intenta ver excepciones de otro médico
```bash
GET /api/medicos/{otroMedicoId}/excepciones
Authorization: Bearer {miToken}
→ 403 "Solo puedes ver tus propias excepciones"
```

### 5. Formato inválido en request
```bash
POST /api/medicos/{medicoId}/agenda
{ "horarios": [{ "dia": 7, ... }] }
→ 400 "día debe estar entre 0 y 6"
```

---

## Flujo De Validación (Ejemplo: POST /medicos/:id/agenda)

```
1. Cliente envía request con token
   ↓
2. Middleware auth.js → Valida token, extrae user en req.user
   ↓
3. Middleware agendaOwnerOrAdmin → Valida si admin o dueño
   ↓
4. express-validator → Valida formato de datos en body
   ↓
5. validateRequest → Retorna 400 si hay errores de validación
   ↓
6. Controller createOrUpdateAgenda
   ├─ Valida que médico existe
   ├─ Valida array de horarios no vacío
   ├─ Por cada horario: valida día 0-6, horas HH:mm, etc.
   └─ Crea/actualiza en BD
   ↓
7. Response 200 con resultado o error
```

---

## Recomendaciones De Seguridad Adicionales (Futuro)

### A Corto Plazo (Importante)
- [ ] Rate limiting en endpoints públicos (GET disponibilidad)
- [ ] Logs de auditoría para cambios de agenda
- [ ] Validación de that fechas no están en el pasado
- [ ] Campos "createdBy" en excepciones (auditoría)

### A Mediano Plazo
- [ ] API keys para terceros que consulten disponibilidad
- [ ] Caché Redis para endpoints GET frecuentes
- [ ] Webhook cuando se crea excepción (notificar pacientes)
- [ ] Historial de cambios de agenda (audit log)

### A Largo Plazo
- [ ] 2FA (Two-Factor Authentication) para admins
- [ ] Role-based access control (RBAC) granular
- [ ] Encryption de datos sensibles en reposo
- [ ] GDPR compliance (derecho al olvido)

---

## Testing De Seguridad

### Pruebas Manuales Recomendadas

```bash
# 1. Test 401 - Sin token
curl -X POST http://localhost:5000/api/medicos/{id}/agenda

# 2. Test 403 - Token de otro médico
curl -H "Authorization: Bearer {otroToken}" \
     -X POST http://localhost:5000/api/medicos/{miId}/agenda

# 3. Test 400 - Validación fallida
curl -H "Authorization: Bearer {token}" \
     -X POST http://localhost:5000/api/medicos/{id}/agenda \
     -d '{"horarios": [{"dia": 99}]}'

# 4. Test 200 - Éxito
curl -H "Authorization: Bearer {token}" \
     -X POST http://localhost:5000/api/medicos/{id}/agenda \
     -d '{"horarios": [{"dia": 1, "horaInicio": "09:00", "horaFin": "18:00"}]}'
```

---

## Revisión De Seguridad Checklist

- [x] Autenticación JWT implementada
- [x] Autorización por rol implementada
- [x] Validación de entrada en routes
- [x] Validación de entrada en models
- [x] Protección CSRF implícita (API sin cookies)
- [x] No hay hardcoded secrets (usa .env)
- [x] Error messages no revelan estructura interna
- [x] SQL injection no aplica (MongoDB)
- [x] No hay traversal path en parámetros
- [ ] Rate limiting (pendiente)
- [ ] Auditoría/logs (pendiente)

---

**Última actualización:** Marzo 2026  
**Status:** ✅ Validaciones completadas en FASE 5  
**Próximo:** Commit y tests en FASE 6
