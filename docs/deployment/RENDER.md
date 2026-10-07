# Despliegue en Render mediante Blueprint

El archivo [`render.yaml`](../../render.yaml) crea dos recursos desde el mismo
repositorio:

| Recurso | Tipo | URL esperada |
|---|---|---|
| `sistema-difuso-g8-api` | Web Service Python | `https://sistema-difuso-g8-api.onrender.com` |
| `sistema-difuso-g8-web` | Static Site | `https://sistema-difuso-g8-web.onrender.com` |

La API construye desde la raíz para conservar acceso a `config/` y `data/`,
instala el paquete definido en `backend/pyproject.toml`, inicia Uvicorn en el
puerto proporcionado por Render y utiliza `/health` como comprobación de salud.
El sitio instala con pnpm, compila Vite y publica `frontend/dist`.

## Antes de desplegar

1. Confirma que todos los cambios estén guardados en Git y enviados a GitHub.
2. Confirma que `render.yaml` esté en la raíz del repositorio.
3. Mantén los nombres de los dos servicios para conservar las URLs configuradas.

Si Render indica que alguno de los nombres ya está ocupado, cambia los nombres y
actualiza también:

- `CORS_ORIGINS` con la nueva URL pública del frontend;
- `VITE_API_URL` con la nueva URL pública del backend.

Las variables no contienen secretos. `VITE_API_URL` se incorpora al JavaScript
durante el build del frontend, por lo que un cambio requiere volver a desplegar el
sitio estático.

## Crear el Blueprint

1. Entra al Dashboard de Render.
2. Selecciona **New → Blueprint**.
3. Conecta el repositorio de GitHub del proyecto.
4. Render detectará `render.yaml` y mostrará los dos servicios.
5. Revisa los nombres, el plan y las variables.
6. Selecciona **Apply** y espera a que ambos despliegues terminen.

Render desplegará automáticamente nuevos commits mediante
`autoDeployTrigger: commit`.

## Verificación posterior

Comprueba estas rutas:

```text
https://sistema-difuso-g8-api.onrender.com/health
https://sistema-difuso-g8-api.onrender.com/docs
https://sistema-difuso-g8-web.onrender.com/manual
https://sistema-difuso-g8-web.onrender.com/historico
https://sistema-difuso-g8-web.onrender.com/historial
https://sistema-difuso-g8-web.onrender.com/metodologia
```

La cabecera debe mostrar **API conectada**. Ejecuta una evaluación manual y una
histórica para confirmar la comunicación entre ambos servicios.

## Diagnóstico rápido

### El frontend indica “API desconectada”

- abre directamente `/health` en la URL del backend;
- revisa que `VITE_API_URL` coincida exactamente con esa URL y no termine en `/`;
- revisa que `CORS_ORIGINS` coincida con el origen del sitio, incluyendo `https://`;
- después de cambiar `VITE_API_URL`, vuelve a desplegar el frontend.

### Una ruta como `/manual` devuelve 404

Comprueba que el Static Site conserve la regla de reescritura `/* → /index.html`.
Esta regla permite que React Router resuelva las rutas del navegador.

### El primer acceso tarda

El plan gratuito puede suspender un Web Service sin actividad. El primer acceso
puede tardar mientras la API vuelve a iniciarse; el frontend mostrará el estado de
conexión si la respuesta aún no está disponible.

## Comandos equivalentes

Backend:

```bash
cd backend
pip install .
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Frontend:

```bash
cd frontend
pnpm install --frozen-lockfile
VITE_API_URL=https://sistema-difuso-g8-api.onrender.com pnpm build
```

Render ya proporciona pnpm cuando detecta `packageManager` en `package.json`.
No se ejecuta `corepack enable`, porque el sistema de archivos de las herramientas
globales de Render es de solo lectura.
