# Hardening Vercel Frontend

## Objetivo
Evitar reincidencias al desplegar el frontend cuando el proyecto de Vercel queda mal asociado al root del monorepo o cuando fallan dependencias en install/build.

## Alcance
- Proyecto frontend de este repositorio.
- Deploy con Vercel CLI.
- Build de CRA (`react-scripts`).

## Precondiciones
- Tener acceso al scope de Vercel: `exequiels-projects-f2574e71`.
- Estar autenticado en Vercel CLI.
- Ejecutar comandos desde `frontend/`.

## Configuracion clave del frontend
1. Archivo `frontend/.npmrc` con:
   - `legacy-peer-deps=true`
2. Archivo `frontend/package.json`:
   - `typescript` pinneado en `4.9.5` (devDependency) para compatibilidad con `react-scripts@5`.
3. Archivo `frontend/vercel.json`:
   - `installCommand`
   - `buildCommand`
   - `outputDirectory`
   - rewrites para SPA

## Flujo recomendado de recreacion (si el proyecto queda mal enlazado)
1. Ir a carpeta frontend:
   - `Set-Location "c:\Users\exede\OneDrive\Desktop\Proyecto Sistema Clínico\frontend"`
2. Desvincular proyecto local actual (si aplica):
   - `npx --yes vercel unlink --yes`
3. Borrar proyecto remoto roto (si aplica):
   - `npx --yes vercel project remove frontend --scope exequiels-projects-f2574e71 --non-interactive`
4. Crear y enlazar proyecto nuevamente desde `frontend/`:
   - `npx --yes vercel --yes --scope exequiels-projects-f2574e71`
   - Elegir nombre de proyecto: `frontend`
   - Confirmar que el root detectado sea la carpeta actual (`frontend/`)
5. Deploy productivo:
   - `npx --yes vercel --prod --yes --scope exequiels-projects-f2574e71`

## Validaciones obligatorias por cambio
1. Build local:
   - `npm run build`
2. Estado git limpio o con cambios esperados:
   - `git status`
3. Push a `main`:
   - `git push`
4. Deploy productivo por CLI:
   - `npx --yes vercel --prod --yes --scope exequiels-projects-f2574e71`
5. Verificar alias final:
   - `https://frontend-theta-nine-61.vercel.app`

## Checklist rapido de diagnostico
- Si aparece `react-scripts: command not found`:
  - Confirmar que el proyecto de Vercel usa `frontend/` como raiz.
- Si falla install por dependencias:
  - Confirmar `.npmrc` con `legacy-peer-deps=true`.
  - Confirmar `typescript@4.9.5`.
- Si rutas internas devuelven 404:
  - Revisar rewrites SPA en `vercel.json`.

## Comandos de referencia
- Build local:
  - `npm run build`
- Deploy productivo:
  - `npx --yes vercel --prod --yes --scope exequiels-projects-f2574e71`
- Revisar ultimo commit:
  - `git log --oneline -n 1`
