# QA local - Botones funcionales de Enfermeria (demo + backend)

## Objetivo
Validar que cada boton del modulo de enfermeria ejecuta su accion y refleja resultado en UI.

## Preparacion
1. Backend local:
   - `cd backend`
   - `npm install`
   - `npm start`
2. Frontend local:
   - `cd frontend`
   - `npm install`
   - `npm start`
3. Modo demo (sin backend real):
   - `REACT_APP_DEMO_MODE=true`

## Botones de navegacion de tabs
En `Area de Enfermeria`, validar que cada boton muestra su panel:
- `Mi Turno`
- `Plan de Cuidados`
- `Calculadora`
- `Alertas`
- `Conocimiento`
- `Heridas`
- `Mensajeria`
- `Pizarra Camas`
- `Carga`
- `Tareas Turno`
- `Handoff`
- `Dashboard`
- `Config`

Resultado esperado: cada click cambia el contenido visible (sin errores en consola).

## Botones de exportacion
En tab `Dashboard`:
- `Exportar CSV`
- `Exportar PDF`
- `Exportar Excel`

Resultado esperado: descarga de archivo en cada accion.

## Tareas Turno
En tab `Tareas Turno`:
1. Click `Generar tareas`.
2. Cambiar estado de una tarea en el selector.

Resultado esperado:
- Se crean tareas nuevas o se regeneran si `overwrite` esta activo.
- El estado actualizado se refleja al recargar datos.

## Handoff
En tab `Handoff`:
1. Completar formulario.
2. Click `Guardar handoff`.
3. Cambiar estado en el selector (`draft/sent/received`).

Resultado esperado:
- Se agrega handoff a la lista.
- El estado cambia y persiste en la vista.

## Formularios existentes
- `Guardar iniciativa`
- `Guardar checklist`
- `Registrar incidente`
- `Guardar umbrales`

Resultado esperado: mensaje de exito y refresco de datos.

## Tour demo
En modo demo:
- Ejecutar tour y verificar pasos nuevos:
  - `Tareas de turno`
  - `Handoff estructurado`

Resultado esperado: el tour encuentra los targets de ambos botones y continua sin salto roto.

## Criterios de aprobacion
- No errores bloqueantes en frontend.
- No 500 en endpoints de enfermeria.
- Todas las acciones de boton disparan su handler esperado.
