import { ExtractoResponse } from './types';
import { organizaciones, imputaciones } from './constants';

/**
 * Convierte fecha de formato YYYY-MM-DD (input date) a dd/MM/yyyy
 */
export function formatDateForAPI(dateString: string): string {
  if (!dateString) return '';
  
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Convierte fecha de formato dd/MM/yyyy a YYYY-MM-DD (para input date)
 */
export function formatDateFromAPI(dateString: string): string {
  if (!dateString) return '';
  
  const [day, month, year] = dateString.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * Formatea rango de fechas para mostrar
 */
export function formatDateRange(fechaDesde: string, fechaHasta: string): string {
  if (fechaDesde === fechaHasta) {
    return fechaDesde;
  }
  return `${fechaDesde} al ${fechaHasta}`;
}

/**
 * Obtiene el nombre de la organización por código
 */
export function getOrganizacionNombre(codigo: number): string {
  const org = organizaciones.find(o => o.codigo === codigo);
  return org?.nombre || 'Desconocida';
}

/**
 * Obtiene el nombre de la imputación por código
 */
export function getImputacionNombre(codigo: number): string {
  const imp = imputaciones.find(i => i.codigo === codigo);
  return imp?.nombre || 'Desconocida';
}

/**
 * Exporta los datos filtrados a CSV (solo tabla de resultados)
 */
export function exportToCSV(
  data: ExtractoResponse,
  codigoOrganizacion: number,
  imputacion: number,
  fechaSorteo?: string,
  fechaDesde?: string,
  fechaHasta?: string,
  filtroTipo?: string,
  filtroModal?: string
): void {
  const nombreOrganizacion = getOrganizacionNombre(codigoOrganizacion);
  const rows: string[] = [];
  
  // Header del CSV simplificado para la tabla de resultados
  rows.push('Posicion,Numero,Fecha,Jurisdiccion,Modalidad,Organizacion,Imputacion');
  
  // Filtrar números según los filtros aplicados
  let numerosFiltrados = data.numeros || [];
  
  if (filtroTipo) {
    numerosFiltrados = numerosFiltrados.filter(num => num.d_tipo === filtroTipo);
  }
  
  if (filtroModal) {
    numerosFiltrados = numerosFiltrados.filter(num => num.d_modal === filtroModal);
  }
  
  // Agregar cada número como una fila
  numerosFiltrados.forEach((item: any, index: number) => {
    const posicion = item.n_ubica || item.posicion || (index + 1);
    const numero = item.n_numero || item.numero || '';
    const jurisdiccion = item.d_tipo || '';
    const modalidad = item.d_modal || '';
    
    // Usar la fecha específica del número si existe, sino usar los parámetros
    let fechaMostrar = item.fechaSorteo || '';
    if (!fechaMostrar) {
      if (fechaSorteo) {
        fechaMostrar = fechaSorteo;
      } else if (fechaDesde && fechaHasta) {
        fechaMostrar = formatDateRange(fechaDesde, fechaHasta);
      }
    }
    
    rows.push(`${posicion},"${numero}","${fechaMostrar}","${jurisdiccion}","${modalidad}","${nombreOrganizacion}",${imputacion}`);
  });
  
  // Si no hay datos después del filtro
  if (numerosFiltrados.length === 0) {
    rows.push('Sin datos,,,,,,"No hay resultados para los filtros seleccionados"');
  }
  
  // Crear y descargar el archivo
  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  // Nombre del archivo con información de filtros
  let fileName = `resultados_${codigoOrganizacion}_${imputacion}`;
  
  if (fechaSorteo) {
    fileName += `_${fechaSorteo.replace(/\//g, '-')}`;
  } else if (fechaDesde && fechaHasta) {
    fileName += `_${fechaDesde.replace(/\//g, '-')}_al_${fechaHasta.replace(/\//g, '-')}`;
  }
  
  if (filtroTipo) fileName += `_${filtroTipo.replace(/[^a-zA-Z0-9]/g, '')}`;
  if (filtroModal) fileName += `_${filtroModal.replace(/[^a-zA-Z0-9]/g, '')}`;
  fileName += '.csv';
  
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}