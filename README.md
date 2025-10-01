# Extractos de Sorteos

Aplicación web para consultar y visualizar extractos de sorteos desde el API público de Lote Móvil.

## 🚀 Características Implementadas

- **Frontend**: React + Vite + TypeScript
- **Estilo**: CSS puro, interfaz minimalista y responsive
- **Funcionalidades**:
  - ✅ Selección de organización y tipo de imputación
  - ✅ **Búsqueda por fecha única** (formato dd/MM/yyyy)
  - ✅ **Búsqueda por rango de fechas** (desde/hasta con límite de 6 meses)
  - ✅ Filtros adicionales por Jurisdicción (d_tipo) y Modalidad (d_modal)
  - ✅ Tabla de resultados con: **Posición, Número, Fecha, Jurisdicción, Modalidad**
  - ✅ **Columna de fecha específica** para cada sorteo consultado
  - ✅ Exportación CSV filtrada con **fecha específica de cada resultado**
  - ✅ Manejo de errores y estados de carga
  - ✅ Llamada al API con Bearer Token incluido
  - ✅ Soporte para proxy en caso de CORS
  - ✅ **Consultas paralelas optimizadas** para rangos de fechas

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

### Búsqueda por Fecha Única
1. Seleccionar **6 - Salta** como organización
2. Seleccionar **0 - Quiniela / Tómbola** como imputación  
3. Elegir **"Fecha única"** como tipo de búsqueda
4. Elegir fecha **2025-09-19**
5. Presionar **"Buscar"**
6. Usar filtros adicionales de Jurisdicción y Modalidad si es necesario
7. **"Exportar CSV"** para descargar los resultados filtrados

### Búsqueda por Rango de Fechas
1. Seleccionar **6 - Salta** como organización
2. Seleccionar **0 - Quiniela / Tómbola** como imputación  
3. Elegir **"Rango de fechas"** como tipo de búsqueda
4. Seleccionar **Fecha desde**: 2025-09-17 y **Fecha hasta**: 2025-09-19
5. Presionar **"Buscar"** (se consultarán todas las fechas del rango)
6. Ver resultados de múltiples fechas con su **fecha específica** en cada fila
7. **"Exportar CSV"** para descargar con fechas específicas incluidas

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

**Nuevas funcionalidades de consulta:**
- **Fecha única**: Una sola consulta al endpoint
- **Rango de fechas**: Múltiples consultas paralelas (una por cada fecha del rango)
- **Límite de rango**: Máximo 6 meses para evitar sobrecarga
- **Tolerancia a errores**: Si una fecha falla, las demás continúan
- **Combinación inteligente**: Resultados de todas las fechas se unen automáticamente

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
- **Columnas**: Posicion, Numero, **Fecha**, Jurisdiccion, Modalidad, Organizacion, Imputacion
- **Filtros aplicados**: Respeta los filtros de Jurisdicción y Modalidad seleccionados
- **Fecha específica**: Cada fila incluye la fecha exacta del sorteo correspondiente
- **Formato nombres**: 
  - Fecha única: `resultados_{org}_{imp}_{fecha}[_filtros].csv`
  - Rango fechas: `resultados_{org}_{imp}_{fechaDesde}_al_{fechaHasta}[_filtros].csv`

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

**🆕 Nuevas funcionalidades v2.0:**
- ✅ Búsqueda por rango de fechas (hasta 6 meses)
- ✅ Columna de fecha específica en tabla y CSV
- ✅ Consultas paralelas optimizadas
- ✅ Validaciones mejoradas de formulario
- ✅ Exportación CSV con fechas específicas

**Próximas mejoras posibles:**
- Paginación para grandes volúmenes de datos
- Gráficos de visualización
- Historial de búsquedas
- Filtros avanzados por rango de números

---

**Desarrollado con ❤️ usando React + Vite + TypeScript**