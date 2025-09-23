# Extractos de Sorteos

Aplicación web para consultar y visualizar extractos de sorteos desde el API público de Lote Móvil.

## 🚀 Características Implementadas

- **Frontend**: React + Vite + TypeScript
- **Estilo**: CSS puro, interfaz minimalista y responsive
- **Funcionalidades**:
  - ✅ Selección de organización y tipo de imputación
  - ✅ Consulta por fecha específica (formato dd/MM/yyyy)
  - ✅ Filtros adicionales por Jurisdicción (d_tipo) y Modalidad (d_modal)
  - ✅ Tabla de resultados con: Posición, Número, Jurisdicción, Modalidad
  - ✅ Exportación CSV filtrada (solo datos de la tabla visible)
  - ✅ Manejo de errores y estados de carga
  - ✅ Llamada al API con Bearer Token incluido
  - ✅ Soporte para proxy en caso de CORS

## 📋 Requisitos

- Node.js 16+ y npm

## 🛠️ Instalación y Uso

1. **Clonar el repositorio:**
```bash
git clone https://github.com/IAtecnoaccion/Proyecto-Extractos.git
cd Proyecto-Extractos
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Ejecutar en modo desarrollo:**
```bash
npm run dev
```

4. **Abrir en el navegador:**
- http://localhost:3000 (o el puerto que indique la consola)

## 🎯 Ejemplo de Uso

1. Seleccionar **6 - Salta** como organización
2. Seleccionar **0 - Quiniela / Tómbola** como imputación  
3. Elegir fecha **2025-09-19**
4. Presionar **"Buscar"**
5. Usar filtros adicionales de Jurisdicción y Modalidad si es necesario
6. **"Exportar CSV"** para descargar los resultados filtrados

## 📊 Filtros Disponibles

### Organizaciones
- 1 - Neuquén | 2 - La Rioja | 3 - La Pampa | 4 - Corrientes
- 5 - Río Negro | 6 - Salta | 7 - Santiago del Estero
- 10 - Jujuy | 12 - Tierra del Fuego | 14 - Catamarca

### Imputaciones
- 0 - Quiniela / Tómbola | 3 - Loto | 4 - Quini 6
- 6 - Pozo Quiniela | 7 - Brinco | 9 - Loto 5
- 10 - Lotería | 21 - Patagonia Telebingo | 25 - Telekino Automatizado

### Filtros Adicionales (Post-búsqueda)
- **Jurisdicción**: Filtra por d_tipo (ej: "Salteña", "Ciudad B.A.", etc.)
- **Modalidad**: Filtra por d_modal (ej: "Matutina", "Vespertina", etc.)

## 🔧 API

**Endpoint consultado:**
```
https://lotemovil.tecnoaccion.com.ar/api/public/{codigoOrganizacion}/extracto?imputacion={imputacion}&fechasorteo={dd/MM/yyyy}
```

**Header requerido:** `Authorization: Bearer [token]` (incluido automáticamente)

## 📁 Estructura del Proyecto

```
src/
├── App.tsx          # Componente principal con formularios y tabla
├── App.css          # Estilos de la aplicación
├── main.tsx         # Punto de entrada
├── index.css        # Estilos globales
├── types.ts         # Interfaces TypeScript
├── constants.ts     # Datos de organizaciones e imputaciones
├── api.ts           # Lógica de consulta al API
└── utils.ts         # Utilidades (fechas, CSV)
```

## 📄 Exportación CSV

El CSV exportado incluye exactamente lo que se ve en la tabla:
- **Columnas**: Posicion, Numero, Jurisdiccion, Modalidad, Organizacion, Imputacion, Fecha
- **Filtros aplicados**: Respeta los filtros de Jurisdicción y Modalidad seleccionados
- **Formato**: `resultados_{org}_{imp}_{fecha}[_filtros].csv`

## 🔧 Configuración Avanzada

### Problemas de CORS
Si hay problemas de CORS, descomentar la configuración de proxy en `vite.config.ts`:

```typescript
proxy: {
  '/api': {
    target: 'https://lotemovil.tecnoaccion.com.ar',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '/api')
  }
}
```

### Compilación para Producción
```bash
npm run build
```

Los archivos compilados estarán en la carpeta `dist/`.

## 🚀 Estado del Proyecto

**✅ Completado** - Listo para usar en producción

**Próximas mejoras posibles:**
- Paginación para grandes volúmenes de datos
- Filtros por rango de fechas
- Gráficos de visualización
- Historial de búsquedas

---

**Desarrollado con ❤️ usando React + Vite + TypeScript**