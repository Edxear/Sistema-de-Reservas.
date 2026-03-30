# IntegraSalud - Security Hardening Checklist

## Runtime
- [x] Security headers activos (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
- [x] JWT validado en middleware central
- [x] Autorizacion por rol en rutas sensibles

## Datos y trazabilidad
- [x] Auditoria de acciones sensibles (usuarios, valoraciones, tickets, ordenes, teleconsultas)
- [x] Trazabilidad longitudinal en historia clinica
- [x] Registro de cambios criticos en soporte

## Operacion
- [x] Endpoint de health operativo
- [x] KPIs y alertas operativas
- [x] Runbook de incidentes documentado

## Pendientes recomendados (siguiente iteracion)
- [ ] Rotacion de claves y secretos gestionada por vault
- [ ] Rate limiting por IP/usuario para endpoints de autenticacion
- [ ] SAST/DAST en pipeline CI/CD
- [ ] Politica de backups con prueba de restauracion automatizada
