# Matriz de Estabilizacion - Commit 110c8a8

## Objetivo
Reducir riesgo de regresion del commit 110c8a844c6e73ca5a3389d56d07963c1dda748f separando cambios por criticidad y estrategia de control.

## Criterios
- Grupo A (bajo riesgo): cambios visuales o de estructura con bajo impacto en datos y permisos.
- Grupo B (riesgo medio): cambios funcionales de UI/rutas y utilidades de acceso.
- Grupo C (alto riesgo): backend de permisos, modelos y endpoints que afectan autorizacion, integridad o datos operativos.

## Grupo A - Mantener
Archivos:
- frontend/src/components/SkeletonLoader.jsx
- frontend/src/components/SkeletonLoader.module.css
- frontend/src/pages/operaciones/OperationalArea.module.css

Riesgo:
- Bajo. Cambios de presentacion y UX no criticos.

Accion:
- Mantener en main.
- Validar visualmente en rutas lazy de areas.

## Grupo B - Mantener con validacion funcional
Archivos:
- frontend/src/components/Header.jsx
- frontend/src/components/ShiftReport.jsx
- frontend/src/pages/guardia/GuardiaMedicaArea.jsx
- frontend/src/pages/mantenimiento/MantenimientoArea.jsx
- frontend/src/pages/paramedicos/ParamedicosArea.jsx
- frontend/src/pages/saludmental/SaludMentalArea.jsx
- frontend/src/pages/operaciones/OperationalDashboard.jsx
- frontend/src/routes/AppRoutes.jsx
- frontend/src/services/areaOperacionalService.js
- frontend/src/utils/demoRoutes.js
- frontend/src/utils/roles.js
- frontend/src/utils/roles.test.js

Riesgo:
- Medio. Cambian navegacion, visibilidad por rol y flujos de pantalla.

Accion:
- Mantener con smoke tests por rol (admin, medico, enfermero, secretaria).
- Verificar que las rutas nuevas no bloqueen accesos existentes.
- Confirmar que demo publico conserva restricciones por host.

## Grupo C - Blindar con pruebas y monitoreo
Archivos:
- backend/middleware/areaOwnership.js
- backend/models/AreaOperacional.js
- backend/controllers/areaOperacionalController.js
- backend/routes/areaOperacional.js
- backend/routes/bedUnits.js
- backend/routes/index.js

Riesgo:
- Alto. Impactan autorizacion por area, integridad de checklists e incidentes, y endpoints de backend.

Accion:
- Agregar pruebas unitarias/integracion para areaOwnership y areaOperacionalController.
- Ejecutar pruebas de regresion de bedUnits con roles no admin.
- Monitorear respuestas 403/409/500 en preview y primeras 24h de produccion.

## Secuencia recomendada de estabilizacion
1. Hardening de runtime/despliegue (Node engines, nvmrc, npm ci en Vercel).
2. Validacion del Grupo A y B con build + smoke funcional.
3. Pruebas automatizadas nuevas para Grupo C.
4. Deploy preview y promocion con checklist de salida.

## Criterios de salida
- Lint backend/frontend sin errores.
- Tests backend verdes incluyendo nuevas pruebas de Grupo C.
- Build frontend exitoso en local y preview.
- Verificacion manual de rutas criticas por rol.
