# Backend

## Seed inicial

El backend y los scripts cargan variables de entorno con esta prioridad:

1. `backend/.env`
2. `.env` en la raiz del workspace (fallback)

El script `npm run seed:initial` requiere estas variables:

- `MONGODB_URI`: cadena de conexion a MongoDB.
- `SEED_INITIAL_PASSWORD`: contraseña inicial que se asignara a las cuentas creadas por el seed.

Ejemplo:

```env
MONGODB_URI=mongodb://localhost:27017/integrasalud
SEED_INITIAL_PASSWORD=una-clave-segura
```

Notas:

- `SEED_INITIAL_PASSWORD` debe tener al menos 12 caracteres.
- `SEED_INITIAL_PASSWORD` debe incluir mayúsculas, minúsculas y números.
- No se versionan contraseñas de seed dentro de `backend/seeds/usuarios-iniciales.json`.
- El grupo `medicosAdmins` se crea con rol `admin` desde el script de seed.

## Recuperar admin principal local

Si falla el login del superadmin principal en local:

```bash
npm run seed:recover-superadmin
```

Este comando crea o actualiza la cuenta principal con el email definido en `backend/seeds/usuarios-iniciales.json` y contraseña priorizando `SEED_SUPERADMIN_PASSWORD` (si existe) o la del seed.
