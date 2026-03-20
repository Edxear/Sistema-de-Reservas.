# Backend

## Seed inicial

El script `npm run seed:initial` requiere estas variables de entorno en el archivo `.env` de la raiz del workspace:

- `MONGODB_URI`: cadena de conexion a MongoDB.
- `SEED_INITIAL_PASSWORD`: contraseña inicial que se asignara a las cuentas creadas por el seed.

Ejemplo:

```env
MONGODB_URI=mongodb://localhost:27017/sistema-reservas
SEED_INITIAL_PASSWORD=una-clave-segura
```

Notas:

- `SEED_INITIAL_PASSWORD` debe tener al menos 12 caracteres.
- `SEED_INITIAL_PASSWORD` debe incluir mayúsculas, minúsculas y números.
- No se versionan contraseñas de seed dentro de `backend/seeds/usuarios-iniciales.json`.
- El grupo `medicosAdmins` se crea con rol `admin` desde el script de seed.
