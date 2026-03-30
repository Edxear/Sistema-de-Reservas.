# Changelog v1.0.0 - IntegraSalud

Fecha: 2026-03-30
Version: 1.0.0
Tipo: Major Release

## Resumen ejecutivo
IntegraSalud alcanza una version integral con capacidades clinicas, operativas y de soporte enterprise. Esta release consolida el roadmap de 10 fases con trazabilidad por commit, validaciones tecnicas y hardening de plataforma.

## Novedades por dominio

### 1. Identidad y estructura
- Rebranding de plataforma a IntegraSalud.
- Reorganizacion estructural de frontend por dominios y rutas centralizadas.
- Registro centralizado de rutas backend.

### 2. Seguridad y cumplimiento
- Auditoria de acciones sensibles con modelo y endpoints administrativos.
- Registro de eventos de seguridad para operaciones criticas.
- Hardening de cabeceras HTTP en runtime.

### 3. Historia clinica longitudinal
- Endpoint longitudinal de historia clinica por paciente.
- Resumen clinico, filtros por tipo y busqueda de eventos.
- Registro de evolucion clinica desde frontend.

### 4. Ordenes y prescripcion
- Nuevo modulo de ordenes medicas (laboratorio, imagen, interconsulta, procedimiento).
- Alertas de seguridad en recetas (duplicidad e interaccion).
- Trazabilidad de ordenes y prescripciones en historia clinica.

### 5. Operacion hospitalaria
- Censo de camas con estados operativos y metricas de ocupacion.
- Gestion de estado de cama en tiempo real desde soporte.

### 6. Interoperabilidad
- Exportacion FHIR Patient.
- Exportacion Bundle clinico FHIR con observaciones.
- Mensaje HL7 ADT A04 para integraciones externas.

### 7. Experiencia paciente y telemedicina
- Teleconsultas con gestion de estado.
- Vista de teleconsultas en perfil de paciente con acceso a sala virtual.

### 8. Soporte inteligente
- Enrutamiento inteligente de tickets por criticidad/tipo/modulo.
- Base de conocimiento versionada para soporte.
- Referencia KB sugerida por ticket.

### 9. Analitica avanzada
- Endpoint de analitica operativa avanzada.
- Alertas de riesgo por SLA, backlog critico, ocupacion de camas y carga de teleconsultas.

### 10. Cierre enterprise
- Runbook operativo estandarizado.
- Checklist de hardening y seguridad.
- Endpoint de health operativo.

## Compatibilidad
- Compatible con version previa de datos para historia clinica/recetas (campos nuevos con defaults).
- No se removieron endpoints existentes principales.

## Validacion tecnica de release
- Backend tests: OK (Jest)
- Frontend build: OK (React build)

## Riesgos conocidos
- Pendiente automatizacion CI/CD con SAST/DAST.
- Pendiente gestion centralizada de secretos (vault).
- Pendiente rate limiting avanzado para auth.
