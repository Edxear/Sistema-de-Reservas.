# IntegraSalud - Runbook Operativo

## 1) Verificacion de servicio
- Backend health: `GET /` y `GET /api/health`
- Frontend: build y disponibilidad de recursos estaticos
- Base de datos: conectividad y latencia aceptable

## 2) Operacion diaria
- Revisar KPIs de soporte y alertas operativas en modulo Soporte
- Revisar backlog critico y SLA de respuesta/resolucion
- Revisar ocupacion de camas y carga de teleconsultas

## 3) Incidente critico
1. Clasificar criticidad y crear ticket (critico)
2. Escalar a L2/L3 en <= 15 minutos
3. Notificar coordinador y direccion clinica
4. Registrar causa raiz y acciones de mitigacion
5. Documentar lecciones aprendidas en base de conocimiento

## 4) Recuperacion operativa
- Validar estado de integraciones HL7/FHIR/DICOM
- Validar turnos, recetas, historia clinica y soporte
- Ejecutar pruebas funcionales minimas post incidente

## 5) Cierre de cambios
- Tests backend: `npm test -- --runInBand`
- Build frontend: `npm run build`
- Auditoria de cambios en logs
- Confirmar commit/push y versionado documental
