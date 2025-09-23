# Extractos de Sorteos

Aplicación web para consultar y visualizar extractos de sorteos desde el API público de Lote Móvil.

## Características

- **Frontend**: React + Vite + TypeScript
- **Estilo**: CSS puro, interfaz minimalista y responsive
- **Funcionalidades**:
  - Selección de organización y tipo de imputación
  - Consulta por fecha específica
  - Visualización de primeros 5 resultados
  - Exportación completa de datos en formato CSV
  - Manejo de errores y estados de carga

## Requisitos

- Node.js 16+ y npm

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Ejecutar en modo desarrollo:
```bash
npm run dev
```

3. Abrir http://localhost:3000 en el navegador

## Uso

### Filtros disponibles

**Organizaciones:**
- 1 - Neuquén
- 2 - La Rioja
- 3 - La Pampa
- 4 - Corrientes
- 5 - Río Negro
- 6 - Salta
- 7 - Santiago del Estero
- 10 - Jujuy
- 12 - Tierra del Fuego
- 14 - Catamarca

**Imputaciones:**
- 0 - Quiniela / Tómbola
- 3 - Loto
- 4 - Quini 6
- 6 - Pozo Quiniela
- 7 - Brinco
- 9 - Loto 5
- 10 - Lotería
- 21 - Patagonia Telebingo
- 25 - Telekino Automatizado

### Ejemplo de uso

1. Seleccionar **Salta (6)** como organización
2. Seleccionar **Quiniela / Tómbola (0)** como imputación  
3. Elegir fecha **19/09/2025**
4. Presionar **"Buscar"**
5. Ver resultados en pantalla
6. Usar **"Exportar CSV"** para descargar todos los datos

### API

La aplicación consulta el endpoint:
```
https://lotemovil.tecnoaccion.com.ar/api/public/{codigoOrganizacion}/extracto?imputacion={imputacion}&fechasorteo={dd/MM/yyyy}
```

Con el header de autorización requerido incluido automáticamente.

## Estructura del proyecto

```
src/
├── App.tsx          # Componente principal
├── App.css          # Estilos de la aplicación
├── main.tsx         # Punto de entrada
├── index.css        # Estilos globales
├── types.ts         # Interfaces TypeScript
├── constants.ts     # Datos de organizaciones e imputaciones
├── api.ts           # Lógica de consulta al API
└── utils.ts         # Utilidades (fechas, CSV)
```

## Exportación CSV

El archivo CSV generado incluye:
- Información general del sorteo
- Modalidades disponibles
- Números sorteados por modalidad
- Premios y premios ganadores (si aplica)

Formato: `extracto_{codigoOrg}_{imputacion}_{fecha}.csv`

## Compilación para producción

```bash
npm run build
```

Los archivos compilados estarán en la carpeta `dist/`.

## Notas técnicas

- **CORS**: Por defecto, la app llama directamente al API. Si hay problemas de CORS, descomentar la configuración de proxy en `vite.config.ts`
- **Token**: El token de autorización está incluido en el código para simplificar el ejemplo
- **Formato de fecha**: Se convierte automáticamente de formato `YYYY-MM-DD` (input date) a `dd/MM/yyyy` (API)
- **TypeScript**: Totalmente tipado con interfaces para la respuesta del API