# IntegraSalud - Plan Maestro de Ejecucion (10 fases)

## Objetivo
Convertir la plataforma actual en un sistema clinico/hospitalario integral, seguro, interoperable y escalable, con entregas auditables por fase.

## Formato de ejecucion por fase
Cada fase debe cerrar con:
1. Desarrollo de alcance comprometido
2. Pruebas tecnicas (backend/frontend)
3. Checklist de regresion funcional
4. Commit unico de fase
5. Push a `main`

Plantilla de commit:
`feat(fase-X): <titulo corto de la fase>`

Plantilla de verificacion minima:
- Backend: `npm test -- --runInBand`
- Frontend: `npm run build`
- Sanidad API: endpoint base y rutas nuevas respondiendo

---

## Fase 1 - Identidad, orden y gobierno tecnico
Objetivo:
- Consolidar naming IntegraSalud, estructura de rutas/componentes y formato de trabajo por fases.

Entregables:
- Branding interno/externo actualizado
- Estructura frontend por dominios/paginas
- Registro centralizado de rutas backend/frontend
- Documento de plan maestro (este archivo)

Criterio de cierre:
- Build frontend ok
- Tests backend ok
- Commit+push de fase

## Fase 2 - Seguridad, IAM y cumplimiento base
Objetivo:
- Fortalecer autenticacion/autorizacion y trazabilidad de acceso.

Entregables:
- MFA opcional por rol critico
- Politicas de sesion/expiracion/refresh
- Auditoria de accesos por recurso sensible
- Endpoints de auditoria para administracion

Criterio de cierre:
- Pruebas de permisos y regresion auth
- Commit+push de fase

## Fase 3 - Historia clinica longitudinal
Objetivo:
- Evolucionar historia clinica a expediente longitudinal.

Entregables:
- Eventos clinicos por paciente (cronologia)
- Evoluciones estructuradas
- Alertas de alergias/antecedentes
- Vistas por perfil (medico/enfermeria/admin)

Criterio de cierre:
- Validacion CRUD clinico + permisos
- Commit+push de fase

## Fase 4 - Ordenes medicas y prescripcion avanzada
Objetivo:
- Gestionar ordenes clinicas completas y seguridad de prescripcion.

Entregables:
- Ordenes de laboratorio/imagen/interconsulta
- Reglas de interaccion/duplicidad en recetas
- Flujo de estados de orden

Criterio de cierre:
- Tests de reglas clinicas prioritarias
- Commit+push de fase

## Fase 5 - Operacion hospitalaria (camas, urgencias, quirofano)
Objetivo:
- Incorporar capacidad operativa hospitalaria en tiempo real.

Entregables:
- Censo de camas y estados
- Triage urgencias y tiempos objetivo
- Agenda quirurgica y checklist preoperatorio

Criterio de cierre:
- Validacion de tablero operativo
- Commit+push de fase

## Fase 6 - Interoperabilidad (FHIR/HL7/DICOM)
Objetivo:
- Habilitar integracion estandar con ecosistema clinico.

Entregables:
- API FHIR inicial para recursos clave
- Adaptadores HL7 basicos
- Metadatos para integracion DICOM/PACS

Criterio de cierre:
- Pruebas de contratos e integracion simulada
- Commit+push de fase

## Fase 7 - Portal paciente y telemedicina
Objetivo:
- Mejorar experiencia digital de paciente y continuidad asistencial.

Entregables:
- Portal paciente (turnos, resultados, recetas)
- Teleconsulta con trazabilidad
- Recordatorios omnicanal

Criterio de cierre:
- QA de experiencia de usuario principal
- Commit+push de fase

## Fase 8 - Soporte clinico inteligente y SLA avanzado
Objetivo:
- Extender soporte con automatizacion y observabilidad operativa.

Entregables:
- Enrutamiento inteligente de tickets
- Dashboards SLA por area/criticidad
- Base de conocimiento operativa versionada

Criterio de cierre:
- Pruebas de flujo ticket->resolucion
- Commit+push de fase

## Fase 9 - Analitica avanzada y alertas predictivas
Objetivo:
- Incorporar metricas clinicas/operativas con alertas tempranas.

Entregables:
- KPIs ejecutivos en tiempo real
- Alertas de riesgo operativo
- Reportes por servicio y tendencia

Criterio de cierre:
- Validacion de consistencia de indicadores
- Commit+push de fase

## Fase 10 - Excelencia operativa y release enterprise
Objetivo:
- Cerrar la plataforma con calidad enterprise, hardening y runbook.

Entregables:
- Checklist de seguridad final
- Plan DR/BCP documentado
- Runbook de operacion y soporte
- Cierre de deuda tecnica prioritaria

Criterio de cierre:
- UAT final + smoke test productivo
- Commit+push de fase

---

## Regla de alcance
- Si una fase detecta funcionalidad no necesaria o duplicada, se elimina dentro de la misma fase con justificacion en el commit.

## Estado actual
- Fase 1: completada (identidad IntegraSalud, orden estructural y formato de ejecucion)
- Fase 2: completada (auditoria base de acciones sensibles y endpoint administrativo)
- Fase 3: completada (historia clinica longitudinal con resumen, filtros y registro de evolucion)
- Fase 4: completada (ordenes medicas + alertas de seguridad en prescripcion)
- Fase 5: completada (censo operativo de camas y control de estado en tiempo real)
- Fase activa: Fase 6
- Proximo hito: capa inicial de interoperabilidad FHIR/HL7 para integraciones externas
