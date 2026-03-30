# Release Checklist v1.0.0 - IntegraSalud

## 1. Pre-release
- [ ] Confirmar rama main actualizada y sin conflictos.
- [ ] Verificar variables de entorno requeridas en backend/frontend.
- [ ] Revisar estado de migraciones/compatibilidad de datos.

## 2. Calidad tecnica
- [ ] Ejecutar backend tests: npm test -- --runInBand
- [ ] Ejecutar frontend build: npm run build
- [ ] Verificar endpoint health: GET /api/health

## 3. Seguridad
- [ ] Confirmar headers de seguridad en respuestas backend.
- [ ] Validar autenticacion/autorizacion en rutas nuevas.
- [ ] Verificar auditoria en operaciones sensibles.

## 4. Validacion funcional minima
- [ ] Crear y consultar registro en historia clinica longitudinal.
- [ ] Crear orden medica y actualizar estado.
- [ ] Crear receta y verificar alertas de seguridad.
- [ ] Consultar censo de camas y cambiar estado.
- [ ] Probar teleconsulta y acceso a sala.
- [ ] Consultar analitica avanzada en soporte.
- [ ] Probar endpoint FHIR/HL7 con paciente real de prueba.

## 5. Operacion y soporte
- [ ] Revisar runbook con equipo de soporte.
- [ ] Confirmar responsables L1/L2/L3 para guardia de release.
- [ ] Definir canal de incidentes post-deploy.

## 6. Despliegue
- [ ] Deploy backend.
- [ ] Deploy frontend.
- [ ] Smoke test en entorno productivo.
- [ ] Habilitar monitoreo post-release por 24h.

## 7. Cierre
- [ ] Publicar release notes internas.
- [ ] Registrar hallazgos y mejoras en backlog.
- [ ] Aprobacion final de cierre de release.
