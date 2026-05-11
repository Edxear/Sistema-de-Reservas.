const CATALOG = {
  'historia-clinica-electronica': {
    objective: 'Gestion longitudinal de historia clinica con evolucion, adjuntos y firmas.',
    actions: [
      { name: 'Ver cronologia del paciente', purpose: 'Consultar eventos clinicos historicos', frontendRoute: '/gestion/pacientes', backend: { method: 'GET', endpoint: '/api/historia-clinica/paciente/:id/longitudinal' }, status: 'operativa', usage: 'Ingresar a pacientes, abrir detalle y revisar historial.' },
      { name: 'Registrar evolucion clinica', purpose: 'Agregar nueva nota de evolucion', frontendRoute: '/gestion/pacientes', backend: { method: 'POST', endpoint: '/api/historia-clinica' }, status: 'operativa', usage: 'Desde detalle de paciente cargar evolucion y guardar.' },
      { name: 'Exportar bundle FHIR clinico', purpose: 'Compartir historia con sistemas externos', backend: { method: 'GET', endpoint: '/api/interoperabilidad/fhir/bundle/:pacienteId' }, status: 'operativa', usage: 'Usar endpoint con consentimiento vigente.' },
    ],
  },
  'laboratorio-resultados': {
    objective: 'Carga, validacion y publicacion de resultados de laboratorio.',
    actions: [
      { name: 'Listar resultados', purpose: 'Ver resultados disponibles y pendientes', backend: { method: 'GET', endpoint: '/api/laboratorio' }, status: 'operativa', usage: 'Filtrar por paciente y fecha para analisis rapido.' },
      { name: 'Registrar resultado', purpose: 'Cargar nuevo resultado de estudio', backend: { method: 'POST', endpoint: '/api/laboratorio' }, status: 'operativa', usage: 'Completar campos clinicos y validar antes de publicar.' },
      { name: 'Escalar valor critico', purpose: 'Notificar hallazgos urgentes', backend: { method: 'POST', endpoint: '/api/notificaciones' }, status: 'parcial', usage: 'Integrar notificacion desde evento critico del laboratorio.' },
    ],
  },
  'imagenologia-diagnostico': {
    objective: 'Gestion de estudios por imagen y resultados asociados.',
    actions: [
      { name: 'Crear solicitud de estudio', purpose: 'Registrar pedido de imagenologia', backend: { method: 'POST', endpoint: '/api/imagenologia' }, status: 'operativa', usage: 'Registrar modalidad, prioridad y paciente.' },
      { name: 'Consultar estudios', purpose: 'Revisar estado de pedidos e informes', backend: { method: 'GET', endpoint: '/api/imagenologia' }, status: 'operativa', usage: 'Filtrar por estado, fecha o paciente.' },
      { name: 'Integrar visor DICOM', purpose: 'Abrir imagenes embebidas en flujo clinico', status: 'planificada', usage: 'Pendiente de embebido PACS completo en frontend.' },
    ],
  },
  'farmacia-dispensacion': {
    objective: 'Control de stock y dispensacion segura por receta.',
    actions: [
      { name: 'Consultar inventario farmaceutico', purpose: 'Ver stock y minimos', backend: { method: 'GET', endpoint: '/api/farmacia' }, status: 'operativa', usage: 'Revisar alertas de stock bajo y vencimientos.' },
      { name: 'Registrar dispensacion', purpose: 'Descontar stock por entrega', backend: { method: 'POST', endpoint: '/api/farmacia' }, status: 'operativa', usage: 'Asociar paciente, receta y lote dispensado.' },
      { name: 'Validar receta antes de dispensar', purpose: 'Reducir errores de medicacion', frontendRoute: '/recetas', backend: { method: 'GET', endpoint: '/api/recetas' }, status: 'operativa', usage: 'Validar interacciones y alergias antes de confirmar.' },
    ],
  },
  'facturacion-cobranzas': {
    objective: 'Facturacion, copagos y seguimiento de deuda.',
    actions: [
      { name: 'Emitir comprobante', purpose: 'Registrar facturacion por atencion', backend: { method: 'POST', endpoint: '/api/facturacion' }, status: 'operativa', usage: 'Crear comprobante con cobertura y arancel.' },
      { name: 'Consultar cuentas pendientes', purpose: 'Monitorear deuda y glosas', backend: { method: 'GET', endpoint: '/api/facturacion' }, status: 'operativa', usage: 'Filtrar por financiador y estado.' },
      { name: 'Conciliar pagos', purpose: 'Cerrar circuito de cobranza', backend: { method: 'POST', endpoint: '/api/pagos' }, status: 'parcial', usage: 'Registrar pago y sincronizar estado de factura.' },
    ],
  },
  'admision-registro-pacientes': {
    objective: 'Ingreso administrativo y clinico del paciente.',
    actions: [
      { name: 'Crear admision', purpose: 'Registrar ingreso de paciente', backend: { method: 'POST', endpoint: '/api/admision' }, status: 'operativa', usage: 'Completar datos de ingreso y validaciones.' },
      { name: 'Consultar admisiones', purpose: 'Monitorear ingresos por turno', backend: { method: 'GET', endpoint: '/api/admision' }, status: 'operativa', usage: 'Filtrar por fecha, estado o tipo de ingreso.' },
      { name: 'Asignar cama inicial', purpose: 'Conectar admision con censo', frontendRoute: '/pizarra', backend: { method: 'PUT', endpoint: '/api/censo-camas/:id' }, status: 'operativa', usage: 'Actualizar estado de cama y referencia de paciente.' },
    ],
  },
  'gestion-agenda-avanzada': {
    objective: 'Gestion de turnos, recordatorios y backfill de agenda.',
    actions: [
      { name: 'Crear turno', purpose: 'Reservar atencion para paciente', frontendRoute: '/turnos', backend: { method: 'POST', endpoint: '/api/bookings' }, status: 'operativa', usage: 'Seleccionar medico, fecha y servicio.' },
      { name: 'Reprogramar turno', purpose: 'Ajustar agenda por cambios operativos', frontendRoute: '/turnos', backend: { method: 'PUT', endpoint: '/api/bookings/:id' }, status: 'operativa', usage: 'Cambiar fecha/hora y notificar al paciente.' },
      { name: 'Gestionar lista de espera', purpose: 'Cubrir huecos por cancelacion', backend: { method: 'GET', endpoint: '/api/lista-espera' }, status: 'operativa', usage: 'Priorizar y activar reemplazo de cupos.' },
    ],
  },
  'notificaciones-mensajeria-interna': {
    objective: 'Comunicacion clinica y operativa entre equipos.',
    actions: [
      { name: 'Listar notificaciones', purpose: 'Ver alertas y mensajes pendientes', backend: { method: 'GET', endpoint: '/api/notificaciones' }, status: 'operativa', usage: 'Revisar bandeja por prioridad.' },
      { name: 'Enviar notificacion interna', purpose: 'Coordinar acciones entre areas', backend: { method: 'POST', endpoint: '/api/notificaciones' }, status: 'operativa', usage: 'Crear mensaje con tipo y urgencia.' },
      { name: 'Mensajeria segura de enfermeria', purpose: 'Coordinar casos por paciente', frontendRoute: '/enfermeria', backend: { method: 'GET', endpoint: '/api/enfermeria/contacts' }, status: 'operativa', usage: 'Abrir tab mensajeria y seleccionar destinatario.' },
    ],
  },
  'reportes-business-intelligence': {
    objective: 'Analitica operativa y ejecutiva por servicios.',
    actions: [
      { name: 'Consultar reportes', purpose: 'Visualizar KPIs y tendencias', backend: { method: 'GET', endpoint: '/api/reportes' }, status: 'operativa', usage: 'Aplicar filtros por periodo y servicio.' },
      { name: 'Exportar indicadores', purpose: 'Compartir metricas en comites', backend: { method: 'GET', endpoint: '/api/reportes/export' }, status: 'parcial', usage: 'Exportar en formato tabular para analisis externo.' },
      { name: 'Consolidar dashboard de enfermeria', purpose: 'Ver semaforos por rama', frontendRoute: '/enfermeria', backend: { method: 'GET', endpoint: '/api/enfermeria/dashboard' }, status: 'operativa', usage: 'Abrir tab dashboard y revisar KPIs.' },
    ],
  },
  'auditoria-logs': {
    objective: 'Trazabilidad de acciones sensibles y cumplimiento.',
    actions: [
      { name: 'Consultar auditoria', purpose: 'Revisar eventos de seguridad', backend: { method: 'GET', endpoint: '/api/audit-logs' }, status: 'operativa', usage: 'Filtrar por actor, accion y rango temporal.' },
      { name: 'Auditar evento de negocio', purpose: 'Registrar accion sensible', backend: { method: 'AUTO', endpoint: 'utils/auditLogger.logAuditEvent' }, status: 'operativa', usage: 'Se ejecuta automaticamente desde controladores.' },
      { name: 'Exportar evidencia', purpose: 'Soporte de auditoria externa', backend: { method: 'GET', endpoint: '/api/audit-logs/export' }, status: 'planificada', usage: 'Pendiente endpoint dedicado de export regulatorio.' },
    ],
  },
  interoperabilidad: {
    objective: 'Intercambio de datos con sistemas externos bajo estandares.',
    actions: [
      { name: 'Exportar FHIR Patient', purpose: 'Compartir demografia segura', backend: { method: 'GET', endpoint: '/api/interoperabilidad/fhir/patient/:pacienteId' }, status: 'operativa', usage: 'Requiere consentimiento vigente para receptor externo.' },
      { name: 'Exportar FHIR Bundle', purpose: 'Enviar paquete clinico completo', backend: { method: 'GET', endpoint: '/api/interoperabilidad/fhir/bundle/:pacienteId' }, status: 'operativa', usage: 'Validar receiver y consentimiento.' },
      { name: 'Generar HL7 ADT A04', purpose: 'Notificar admision a sistemas externos', backend: { method: 'GET', endpoint: '/api/interoperabilidad/hl7/adt-a04/:pacienteId' }, status: 'operativa', usage: 'Consumir respuesta en texto plano HL7.' },
    ],
  },
  'telemedicina-avanzada': {
    objective: 'Atencion remota con trazabilidad clinica.',
    actions: [
      { name: 'Crear teleconsulta', purpose: 'Agendar sesion virtual', frontendRoute: '/teleconsultas', backend: { method: 'POST', endpoint: '/api/teleconsultas' }, status: 'operativa', usage: 'Completar paciente, medico, fecha y enlace.' },
      { name: 'Listar teleconsultas', purpose: 'Ver sesiones por actor', frontendRoute: '/teleconsultas', backend: { method: 'GET', endpoint: '/api/teleconsultas/mis' }, status: 'operativa', usage: 'Revisar por estado y proximidad.' },
      { name: 'Actualizar estado de sesion', purpose: 'Cerrar ciclo asistencial', frontendRoute: '/teleconsultas', backend: { method: 'PUT', endpoint: '/api/teleconsultas/:id/estado' }, status: 'operativa', usage: 'Cambiar entre programada, en_curso, finalizada o cancelada.' },
    ],
  },
  'gestion-cuidados-criticos-uci': {
    objective: 'Monitoreo continuo de pacientes criticos.',
    actions: [
      { name: 'Crear episodio UCI', purpose: 'Registrar ingreso a cuidados criticos', backend: { method: 'POST', endpoint: '/api/uci/episodios' }, status: 'operativa', usage: 'Cargar paciente, cama y motivo de ingreso.' },
      { name: 'Registrar constantes', purpose: 'Cargar signos vitales y calcular MEWS', backend: { method: 'POST', endpoint: '/api/uci/constantes' }, status: 'operativa', usage: 'Registrar valores hemodinamicos por episodio.' },
      { name: 'Dashboard UCI', purpose: 'Ver estado de episodios activos', backend: { method: 'GET', endpoint: '/api/uci/dashboard' }, status: 'operativa', usage: 'Consultar ultima constante y alarmas por episodio.' },
    ],
  },
  'control-acceso-por-rol': {
    objective: 'Gestionar permisos y segregacion de funciones.',
    actions: [
      { name: 'Administrar usuarios y roles', purpose: 'Actualizar perfil y privilegios', frontendRoute: '/gestion/medicos', backend: { method: 'PUT', endpoint: '/api/users/:id' }, status: 'operativa', usage: 'Modificar rol con criterio de minimo privilegio.' },
      { name: 'Consultar matriz de acceso', purpose: 'Revisar cobertura RBAC', backend: { method: 'GET', endpoint: '/api/users' }, status: 'operativa', usage: 'Listar usuarios y verificar rol asignado.' },
      { name: 'Recertificacion periodica', purpose: 'Reducir permisos excesivos', status: 'planificada', usage: 'Pendiente flujo formal de aprobacion dual.' },
    ],
  },
  'inventario-insumos-equipos': {
    objective: 'Control logistico de insumos y equipos.',
    actions: [
      { name: 'Consultar inventario', purpose: 'Ver stock actual y alertas', backend: { method: 'GET', endpoint: '/api/inventario' }, status: 'operativa', usage: 'Filtrar por categoria, estado y area.' },
      { name: 'Registrar movimiento', purpose: 'Actualizar entradas/salidas', backend: { method: 'POST', endpoint: '/api/inventario' }, status: 'operativa', usage: 'Cargar movimiento con responsable y origen.' },
      { name: 'Integrar inventario con quirofano', purpose: 'Trazar consumo por procedimiento', status: 'parcial', usage: 'Conectar evento de consumo desde modulo quirurgico.' },
    ],
  },
  'gestion-donantes-transfusiones': {
    objective: 'Gestion de hemoderivados y seguridad transfusional.',
    actions: [
      { name: 'Registrar unidad en banco', purpose: 'Mantener stock de hemoterapia', status: 'planificada', usage: 'Pendiente API dedicada de hemoterapia.' },
      { name: 'Validar prueba cruzada', purpose: 'Asegurar compatibilidad', status: 'planificada', usage: 'Pendiente flujo completo de compatibilidad.' },
      { name: 'Registrar administracion', purpose: 'Trazabilidad clinica de transfusion', status: 'planificada', usage: 'Pendiente integracion con enfermeria.' },
    ],
  },
  'biopsias-anatomia-patologica': {
    objective: 'Pipeline de muestras e informes anatomopatologicos.',
    actions: [
      { name: 'Cargar muestra', purpose: 'Iniciar cadena de custodia', status: 'planificada', usage: 'Pendiente endpoint operativo de muestras.' },
      { name: 'Asignar a patologo', purpose: 'Distribuir carga por subespecialidad', status: 'planificada', usage: 'Pendiente motor de asignacion.' },
      { name: 'Publicar informe AP', purpose: 'Vincular resultado en HCE', status: 'planificada', usage: 'Pendiente integracion documental final.' },
    ],
  },
  'nutricion-dietoterapia': {
    objective: 'Gestion de dietas y seguridad alimentaria del paciente.',
    actions: [
      { name: 'Registrar plan de dieta', purpose: 'Definir esquema nutricional por paciente', status: 'planificada', usage: 'Pendiente endpoint especifico de nutricion.' },
      { name: 'Controlar alergias alimentarias', purpose: 'Evitar errores de entrega', status: 'planificada', usage: 'Pendiente validacion cruzada con HCE.' },
      { name: 'Emitir orden a cocina', purpose: 'Orquestar preparacion por turno', status: 'planificada', usage: 'Pendiente workflow cocina-enfermeria.' },
    ],
  },
  'kinesiologia-rehabilitacion': {
    objective: 'Seguimiento funcional y terapeutico de rehabilitacion.',
    actions: [
      { name: 'Crear plan de rehabilitacion', purpose: 'Definir objetivos y fases', status: 'planificada', usage: 'Pendiente modulo clinico dedicado.' },
      { name: 'Registrar sesion', purpose: 'Documentar evolucion por encuentro', status: 'planificada', usage: 'Pendiente carga estructurada de sesiones.' },
      { name: 'Emitir alta funcional', purpose: 'Cerrar proceso terapeutico', status: 'planificada', usage: 'Pendiente informe final integrado.' },
    ],
  },
  'trabajo-social': {
    objective: 'Intervencion social y continuidad de cuidados.',
    actions: [
      { name: 'Abrir caso social', purpose: 'Registrar necesidad sociofamiliar', status: 'planificada', usage: 'Pendiente backend de casos sociales.' },
      { name: 'Registrar derivacion', purpose: 'Conectar red de apoyo externa', status: 'planificada', usage: 'Pendiente tracking de derivaciones.' },
      { name: 'Cerrar plan social', purpose: 'Medir resultado de intervencion', status: 'planificada', usage: 'Pendiente tablero de seguimiento.' },
    ],
  },
  'gestion-esterilizacion-central': {
    objective: 'Control de esterilizacion y trazabilidad de instrumental.',
    actions: [
      { name: 'Registrar ciclo de autoclave', purpose: 'Documentar esterilizacion por lote', status: 'planificada', usage: 'Pendiente API de central de esterilizacion.' },
      { name: 'Asignar set esteril', purpose: 'Garantizar entrega segura a quirofano', status: 'planificada', usage: 'Pendiente integracion con bloques quirurgicos.' },
      { name: 'Monitorear vencimientos', purpose: 'Evitar uso de set vencido', status: 'planificada', usage: 'Pendiente alertas automaticas por lote.' },
    ],
  },
  'comites-auditoria-clinica': {
    objective: 'Gestion de casos de calidad y acciones correctivas.',
    actions: [
      { name: 'Registrar caso de comite', purpose: 'Iniciar analisis de evento', status: 'planificada', usage: 'Pendiente tablero de comite clinico.' },
      { name: 'Plan de mejora', purpose: 'Definir acciones correctivas', status: 'planificada', usage: 'Pendiente workflow de responsables y fechas.' },
      { name: 'Cerrar no conformidad', purpose: 'Documentar evidencia de cierre', status: 'planificada', usage: 'Pendiente matriz de cumplimiento.' },
    ],
  },
  'docencia-investigacion': {
    objective: 'Operacion academica y de investigacion institucional.',
    actions: [
      { name: 'Gestionar rotaciones', purpose: 'Planificar residentes por servicio', status: 'planificada', usage: 'Pendiente modulo academico operativo.' },
      { name: 'Registrar protocolo I+D', purpose: 'Control documental de investigacion', status: 'planificada', usage: 'Pendiente flujo de aprobacion etica.' },
      { name: 'Seguimiento de consentimientos', purpose: 'Cumplimiento legal en estudios', status: 'planificada', usage: 'Pendiente integracion con consentimiento digital.' },
    ],
  },
  'atencion-domiciliaria': {
    objective: 'Planificacion y ejecucion de visitas en domicilio.',
    actions: [
      { name: 'Programar visita', purpose: 'Asignar prestacion domiciliaria', status: 'planificada', usage: 'Pendiente agenda territorial dedicada.' },
      { name: 'Registrar prestacion en domicilio', purpose: 'Documentar atencion extramuros', status: 'planificada', usage: 'Pendiente app de campo con sincronizacion.' },
      { name: 'Cerrar visita con firma', purpose: 'Generar evidencia de prestacion', status: 'planificada', usage: 'Pendiente captura de firma y geolocalizacion.' },
    ],
  },
  'portal-paciente-autogestion': {
    objective: 'Autoservicio digital para pacientes.',
    actions: [
      { name: 'Gestionar turnos', purpose: 'Reservar o reprogramar cita', frontendRoute: '/turnos', backend: { method: 'GET/POST', endpoint: '/api/bookings' }, status: 'operativa', usage: 'Usar panel de turnos desde cuenta paciente.' },
      { name: 'Revisar teleconsultas', purpose: 'Entrar y seguir consultas remotas', frontendRoute: '/teleconsultas', backend: { method: 'GET', endpoint: '/api/teleconsultas/mis' }, status: 'operativa', usage: 'Filtrar por proximas y finalizadas.' },
      { name: 'Consultar perfil y datos', purpose: 'Actualizar datos personales', frontendRoute: '/perfil', backend: { method: 'PUT', endpoint: '/api/auth/me' }, status: 'operativa', usage: 'Editar perfil y guardar cambios.' },
    ],
  },
  'modulo-urgencias-avanzado': {
    objective: 'Gestion de triage y atencion de urgencias.',
    actions: [
      { name: 'Visualizar pizarra de urgencias', purpose: 'Control operativo de camas y estado', frontendRoute: '/guardia-medica', status: 'parcial', usage: 'Usar dashboard de guardia para monitor rapido.' },
      { name: 'Registrar orden urgente', purpose: 'Activar estudios/procedimientos criticos', frontendRoute: '/ordenes-medicas', backend: { method: 'POST', endpoint: '/api/ordenes-medicas' }, status: 'operativa', usage: 'Cargar orden con prioridad alta/urgente.' },
      { name: 'Pase a internacion', purpose: 'Transferir paciente con resumen', status: 'planificada', usage: 'Pendiente workflow de pase estructurado.' },
    ],
  },
  'quirofanos-bloques-quirurgicos': {
    objective: 'Programacion y control de actividad quirurgica.',
    actions: [
      { name: 'Planificar bloque quirurgico', purpose: 'Asignar sala y horario', status: 'planificada', usage: 'Pendiente agenda quirurgica dedicada.' },
      { name: 'Checklist OMS digital', purpose: 'Reducir riesgo perioperatorio', status: 'planificada', usage: 'Pendiente formulario pre/intra/post en UI.' },
      { name: 'Control de insumos por procedimiento', purpose: 'Trazar costo y consumo', status: 'planificada', usage: 'Pendiente integracion inventario-quirofano.' },
    ],
  },
  'unidad-cuidados-paliativos': {
    objective: 'Seguimiento integral de sintomas y cuidados paliativos.',
    actions: [
      { name: 'Registrar escala de sintomas', purpose: 'Medir carga sintomatica', status: 'planificada', usage: 'Pendiente formulario EVA/ESAS integrado.' },
      { name: 'Plan terapeutico paliativo', purpose: 'Coordinar tratamiento interdisciplinario', status: 'planificada', usage: 'Pendiente workflow de objetivos de cuidado.' },
      { name: 'Seguimiento familiar', purpose: 'Registrar acompanamiento y duelo', status: 'planificada', usage: 'Pendiente modulo de continuidad familiar.' },
    ],
  },
  'rehabilitacion-cardiovascular-ergometria': {
    objective: 'Control de pruebas y rehabilitacion cardiovascular.',
    actions: [
      { name: 'Registrar ergometria', purpose: 'Cargar resultados de prueba de esfuerzo', status: 'planificada', usage: 'Pendiente endpoint cardio funcional.' },
      { name: 'Plan de rehabilitacion cardio', purpose: 'Definir sesiones y metas', status: 'planificada', usage: 'Pendiente agenda y seguimiento cardio.' },
      { name: 'Monitorear adherencia', purpose: 'Controlar continuidad del programa', status: 'planificada', usage: 'Pendiente panel de adherencia por paciente.' },
    ],
  },
  'modulo-salud-ocupacional': {
    objective: 'Gestion de examenes y aptitud laboral.',
    actions: [
      { name: 'Crear examen ocupacional', purpose: 'Registrar estudio laboral', status: 'planificada', usage: 'Pendiente modulo de medicina laboral.' },
      { name: 'Emitir apto', purpose: 'Concluir evaluacion con dictamen', status: 'planificada', usage: 'Pendiente generador de aptitud digital.' },
      { name: 'Reporte de ausentismo', purpose: 'Analizar desvio por empresa', status: 'planificada', usage: 'Pendiente tablero estadistico de empresas.' },
    ],
  },
  'gestion-residuos-biologicos': {
    objective: 'Cumplimiento ambiental en gestion de residuos sanitarios.',
    actions: [
      { name: 'Registrar lote de residuo', purpose: 'Trazar origen y tipo de residuo', status: 'planificada', usage: 'Pendiente API ambiental dedicada.' },
      { name: 'Control de almacenamiento', purpose: 'Validar tiempos y condiciones', status: 'planificada', usage: 'Pendiente panel de condiciones de guarda.' },
      { name: 'Registrar retiro autorizado', purpose: 'Cerrar circuito con manifiesto', status: 'planificada', usage: 'Pendiente carga documental de retiro.' },
    ],
  },
};

const FALLBACK = {
  objective: 'Modulo en definicion funcional detallada.',
  actions: [
    {
      name: 'Analisis funcional pendiente',
      purpose: 'Definir flujo operativo completo',
      status: 'planificada',
      usage: 'Completar matriz funcional para habilitar accion ejecutable.',
    },
  ],
};

export function getAreaFunctionCatalog(slug) {
  return CATALOG[slug] || FALLBACK;
}
