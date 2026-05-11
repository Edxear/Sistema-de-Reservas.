# Analisis de areas y brechas de implementacion (Mayo 2026)

## 1) Alcance del analisis

Este documento cruza:
- Areas estrategicas declaradas por el sistema (`backend/data/strategicModulesData.js`).
- Implementacion real en backend (rutas, controladores, modelos, pruebas).
- Implementacion real en frontend (paginas, servicios y rutas).

Objetivo: detallar que esta implementado, que esta parcial y que falta, con mejoras accionables.

## 2) Resumen ejecutivo

- Inventario de areas existentes en mapa estrategico: **31 modulos**.
- Areas nuevas con implementacion tecnica clara (backend + evidencia en frontend):
  - Enfermeria
  - Teleconsultas / Telemedicina
  - UCI / Cuidados criticos
  - Interoperabilidad
  - Modulos estrategicos (hub)
- Cobertura de pruebas para areas nuevas:
  - Estrategicos: existe `backend/__tests__/strategicModules.routes.test.js`.
  - Enfermeria/UCI/Teleconsulta/Interoperabilidad: **sin pruebas dedicadas detectadas**.

Riesgo principal actual: hay funcionalidad operativa en produccion sin suite minima de regresion para varias areas criticas.

## 3) Estado por area nueva (detalle)

## 3.1 Enfermeria

### Evidencia de implementacion
- Backend: `backend/routes/nursing.js`, `backend/controllers/nursingController.js`.
- Modelos: checklists, incidentes, configuracion, iniciativas y fotos de heridas.
- Frontend: `frontend/src/pages/enfermeria/Enfermeria.jsx`, `frontend/src/services/enfermeriaService.js`.

### Fortalezas actuales
- Control de permisos por rol y jerarquia de enfermeria.
- Dashboard con KPI, semaforos y resumen por rama.
- Flujos de incidentes, iniciativas, carga de trabajo, ayuda rapida y organigrama.
- Auditoria para acciones sensibles.

### Brechas detectadas
- Falta de pruebas automatizadas de rutas/controladores.
- Listados sin paginacion robusta (se usa `limit` fijo en varios endpoints).
- Fotos de heridas almacenadas como data URL en BD (alto peso, costos de I/O y riesgo de privacidad).
- Varias funcionalidades del roadmap de enfermeria siguen parciales:
  - pizarra en tiempo real multiusuario (sin canal websocket especifico para enfermeria),
  - tareas de turno auto-generadas,
  - handoff estructurado con versionado,
  - reglas de alerta clinica configurables por tipo de paciente.

### Mejoras detalladas pendientes (prioridad)
- P0 (seguridad y estabilidad)
  - Migrar `imageDataUrl` a almacenamiento de objetos + URL firmada corta.
  - Agregar control de tamaño MIME/imagen y antivirus basico en upload.
  - Crear suite de pruebas `nursing.routes.test.js` (auth, permisos, validaciones, scoping por rama).
- P1 (funcional)
  - Crear modulo de tareas de turno:
    - `NursingTaskTemplate`, `NursingShiftTask`, `NursingHandoff`.
    - Endpoint de generacion automatica por turno en base a pacientes/ordenes.
  - Handoff con estados (`draft`, `sent`, `received`) y firma digital interna.
  - Alertas de enfermeria por reglas configurables (thresholds por perfil de paciente).
- P2 (experiencia)
  - Paginacion + filtros compuestos (rama, paciente, severidad, fecha) en incidentes/checklists/fotos.
  - Exportacion estandar (CSV/XLSX/PDF) con esquema comun.

## 3.2 UCI / Cuidados criticos

### Evidencia de implementacion
- Backend: `backend/routes/uci.js`, `backend/controllers/uciController.js`.
- Modelos: `EpisodioUCI`, `ConstanteVital`, `BalanceHidrico`, `EscalaClinica`.
- Integracion de alerta MEWS a notificaciones.

### Brechas detectadas
- Sin pruebas dedicadas de UCI.
- Validaciones clinicas insuficientes en ingreso de datos (rangos fisiologicos, consistencia por episodio).
- Dashboard con patron N+1 al buscar ultima constante por episodio.
- Sin trazabilidad de auditoria explicita en operaciones UCI criticas.

### Mejoras detalladas pendientes
- P0
  - Suite `uci.routes.test.js` para permisos, egreso, MEWS y errores de validacion.
  - Validacion de payload con esquema (Joi/Zod/express-validator) para constantes, balance y escalas.
- P1
  - Optimizar dashboard UCI con agregacion (`$group` + `max(fechaHora)`) para evitar N+1.
  - Agregar `logAuditEvent` en alta/egreso y registros de constantes/escalas.
- P2
  - Tendencias por paciente (sparklines de FC/PAS/SpO2 y balance 24h/48h).
  - Alertas parametrizadas por diagnostico/edad/condicion ventilatoria.

## 3.3 Teleconsultas / Telemedicina

### Evidencia de implementacion
- Backend: `backend/routes/teleconsultas.js`, `backend/controllers/teleconsultaController.js`.
- Frontend: `frontend/src/pages/teleconsultas/Teleconsultas.jsx`, `frontend/src/services/teleconsultaService.js`.

### Brechas detectadas
- Sin pruebas dedicadas.
- `updateTeleconsultaStatus` no valida ownership/participacion fina por recurso (paciente-medico-session).
- Falta de politicas de expiracion/rotacion para enlaces de sala.
- Faltan indicadores operativos clave (no-show, tiempo de espera, tiempo promedio real).

### Mejoras detalladas pendientes
- P0
  - Control por recurso: solo medico tratante, admin o actor permitido puede cambiar estado.
  - Enlace de sala con token temporal y expiracion.
  - Pruebas `teleconsulta.routes.test.js` para seguridad por rol/propiedad.
- P1
  - Flujo de pre-check tecnico del paciente (audio/video/red) antes de iniciar.
  - Estados extendidos (`confirmada`, `ausente`, `reprogramada`) y motivo estructurado.
- P2
  - Dashboard SLA de telemedicina y reportes de calidad de llamada.

## 3.4 Interoperabilidad

### Evidencia de implementacion
- Backend: `backend/routes/interoperabilidad.js`, `backend/controllers/interoperabilidadController.js`.
- Modelos: `EndpointExterno`, `TransaccionIntercambio`, `ConsentimientoInterop`.
- Exports FHIR Patient/Bundle/Observation y HL7 ADT A04 con trazabilidad.

### Brechas detectadas
- Sin pruebas dedicadas (contratos y permisos).
- Falta verificacion de seguridad saliente por endpoint (firma/HMAC/mTLS segun contraparte).
- Sin versionado explicito de contratos por recurso.
- Listado de transacciones con `limit` pero sin paginacion por cursor/offset formal.

### Mejoras detalladas pendientes
- P0
  - Pruebas `interoperabilidad.routes.test.js` para:
    - consentimiento vigente/no vigente,
    - filtros de transacciones,
    - formato minimo FHIR/HL7.
  - Capa de firma/verificacion por endpoint externo (HMAC + timestamp + nonce).
- P1
  - Catalogo de versiones por contrato (`v1`, `v2`) y header de negociacion.
  - Paginacion cursor para `listTransactions` y retencion configurable.
- P2
  - Monitor de conectores (latencia p95, retries, error-rate por receptor).

## 3.5 Hub de Modulos Estrategicos

### Evidencia de implementacion
- Backend: `backend/routes/strategicModules.js`, `backend/controllers/strategicModulesController.js`.
- Frontend: `frontend/src/pages/modulos/StrategicModulesHub.jsx`.
- Datos base: `backend/data/strategicModulesData.js` (31 modulos).

### Brechas detectadas
- Existe test de rutas, pero falta cobertura de mutaciones y autorizacion fina de checkpoints.
- `patchModuleCheckpoint` permite cambios a cualquier rol incluido en `allowedRoles`; para gobierno puede requerirse solo owner/admin.
- Varias areas del hub pueden estar en modo informativo (catalogadas) sin endpoint operativo especifico propio.

### Mejoras detalladas pendientes
- P0
  - Endurecer permisos de edicion checkpoints (`admin/superadmin` u owner explicito).
  - Pruebas de regresion para `PATCH /checkpoints` por rol.
- P1
  - Declarar por modulo el estado tecnico real:
    - `catalog_only`, `api_partial`, `api_ready`, `ui_ready`, `prod_ready`.
- P2
  - Health-check por modulo con evidencia automatica (ruta + test + ultima ejecucion).

## 4) Estado de areas existentes (31 modulos)

El sistema tiene 31 modulos en catalogo estrategico. Para gestion real, conviene dividirlos en dos capas:

- Capa A: modulos con implementacion backend/frontend verificable en este analisis.
- Capa B: modulos catalogados en hub estrategico, con necesidad de verificacion tecnica especifica modulo por modulo.

### Capa A (verificados en este analisis)
- historia-clinica-electronica
- laboratorio-resultados
- imagenologia-diagnostico
- farmacia-dispensacion
- facturacion-cobranzas
- admision-registro-pacientes
- gestion-agenda-avanzada
- notificaciones-mensajeria-interna
- reportes-business-intelligence
- auditoria-logs
- interoperabilidad
- telemedicina-avanzada
- gestion-cuidados-criticos-uci
- inventario-insumos-equipos
- control-acceso-por-rol
- enfermeria (modulo funcional fuera del catalogo de 31, pero implementado)

### Capa B (catalogo estrategico a validar con checklist tecnico)
- gestion-donantes-transfusiones
- biopsias-anatomia-patologica
- nutricion-dietoterapia
- kinesiologia-rehabilitacion
- trabajo-social
- gestion-esterilizacion-central
- comites-auditoria-clinica
- docencia-investigacion
- atencion-domiciliaria
- portal-paciente-autogestion
- modulo-urgencias-avanzado
- quirofanos-bloques-quirurgicos
- unidad-cuidados-paliativos
- rehabilitacion-cardiovascular-ergometria
- modulo-salud-ocupacional
- gestion-residuos-biologicos

## 5) Plan de implementacion recomendado (6 semanas)

## Semana 1-2 (Riesgo alto)
- Crear suites de pruebas faltantes: enfermeria, uci, teleconsulta, interoperabilidad.
- Endurecer permisos en teleconsulta e strategic checkpoints.
- Definir validaciones de entrada por esquema (payload contracts).

## Semana 3-4 (Funcionalidad faltante)
- Implementar tareas de turno + handoff estructurado en enfermeria.
- Optimizar dashboard UCI y agregar trazabilidad completa.
- Implementar seguridad de enlaces de teleconsulta (token temporal).

## Semana 5-6 (Escalabilidad y gobierno)
- Paginacion formal en listados clinicos y de trazabilidad.
- Versionado de contratos de interoperabilidad.
- Etiqueta de madurez por modulo estrategico (`catalog_only` a `prod_ready`).

## 6) Definition of Done por area

Cada area se considera cerrada cuando cumpla:
- API con validacion de entrada y control de permisos por recurso.
- Pruebas de rutas criticas en CI.
- UI principal conectada a API real.
- Auditoria de acciones sensibles.
- Metricas de operacion y alertas basicas.

## 7) Recomendacion de governance

Agregar en cada PR de area una seccion obligatoria:
- Riesgo clinico/operativo
- Pruebas agregadas
- Impacto en permisos
- Backward compatibility
- Evidencia de despliegue (captura o resultado de test)
