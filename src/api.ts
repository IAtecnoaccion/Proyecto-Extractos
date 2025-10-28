import { ExtractoResponse, ExtractoFilters } from './types';
import { BEARER_TOKEN } from './constants';

/**
 * Realiza la consulta al API de extractos
 */
export async function fetchExtracto(filters: ExtractoFilters): Promise<ExtractoResponse> {
  if (filters.tipoBusqueda === 'rango') {
    return await fetchExtractoRango(filters);
  } else {
    return await fetchExtractoUnico(filters);
  }
}

/**
 * Consulta extracto para una fecha única
 */
async function fetchExtractoUnico(filters: ExtractoFilters): Promise<ExtractoResponse> {
  const { organizacion, imputacion, fecha } = filters;
  
  if (!fecha) {
    throw new Error('Fecha es requerida para búsqueda única');
  }
  
  // URLs según entorno
  const urlDirect = import.meta.env.PROD 
    ? `/api/public/${organizacion}/extracto?imputacion=${imputacion}&fechasorteo=${encodeURIComponent(fecha)}`
    : `/api/public/${organizacion}/extracto?imputacion=${imputacion}&fechasorteo=${encodeURIComponent(fecha)}`; // Usar proxy en desarrollo
  
  console.log('Fecha enviada al API:', fecha);
  console.log('URL a usar:', urlDirect);
  console.log('Entorno:', import.meta.env.PROD ? 'Producción (Vercel)' : 'Desarrollo');
  
  try {
    // En producción usar la función serverless, en desarrollo usar el proxy
    const response = await fetch(urlDirect, {
      method: 'GET',
      headers: import.meta.env.PROD ? {
        // En producción no enviar el token (lo maneja la función serverless)
        'Content-Type': 'application/json',
      } : {
        // En desarrollo enviar el token (el proxy lo reenvía)
        'Authorization': `Bearer ${BEARER_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Respuesta exitosa:', data);
    
    // Agregar la fecha consultada a cada número para búsquedas únicas
    if (data.numeros && Array.isArray(data.numeros)) {
      data.numeros = data.numeros.map((numero: any) => ({
        ...numero,
        fechaSorteo: fecha
      }));
    }
    
    return data;
    
  } catch (error) {
    console.error('Error en fetchExtractoUnico:', error);
    throw error;
  }
}

/**
 * Consulta extracto para un rango de fechas
 * Ahora con límite de concurrencia para evitar sobrecargar el servidor
 */
async function fetchExtractoRango(filters: ExtractoFilters): Promise<ExtractoResponse> {
  const { organizacion, imputacion, fechaDesde, fechaHasta } = filters;
  
  if (!fechaDesde || !fechaHasta) {
    throw new Error('Fecha desde y fecha hasta son requeridas para búsqueda por rango');
  }
  
  console.log('Buscando extractos en rango:', fechaDesde, 'a', fechaHasta);
  
  // Generar array de fechas en el rango
  const fechas = generarRangoFechas(fechaDesde, fechaHasta);
  console.log(`Total de fechas a consultar: ${fechas.length}`);
  
  // Procesar en lotes para evitar sobrecarga
  const TAMANO_LOTE = 5; // Consultar 5 fechas a la vez
  const DELAY_ENTRE_LOTES = 500; // 500ms entre lotes
  
  const resultadosValidos: ExtractoResponse[] = [];
  
  for (let i = 0; i < fechas.length; i += TAMANO_LOTE) {
    const loteFechas = fechas.slice(i, i + TAMANO_LOTE);
    console.log(`Procesando lote ${Math.floor(i / TAMANO_LOTE) + 1}/${Math.ceil(fechas.length / TAMANO_LOTE)}: ${loteFechas.length} fechas`);
    
    // Realizar consultas para este lote
    const promesasLote = loteFechas.map(fecha => 
      fetchExtractoUnico({
        organizacion,
        imputacion,
        fecha,
        tipoBusqueda: 'unica'
      }).then(resultado => {
        // Agregar la fecha consultada al resultado
        if (resultado && resultado.numeros && resultado.numeros.length > 0) {
          resultado.fechaConsultada = fecha;
          console.log(`✓ Fecha ${fecha}: ${resultado.numeros.length} números encontrados`);
          return resultado;
        }
        console.log(`⊘ Fecha ${fecha}: Sin datos`);
        return null;
      }).catch(error => {
        console.warn(`✗ Fecha ${fecha}: Error ${error.message}`);
        return null; // Retornar null en caso de error para esa fecha
      })
    );
    
    const resultadosLote = await Promise.all(promesasLote);
    
    // Agregar solo resultados válidos
    resultadosLote.forEach(resultado => {
      if (resultado !== null) {
        resultadosValidos.push(resultado);
      }
    });
    
    // Delay entre lotes (excepto en el último)
    if (i + TAMANO_LOTE < fechas.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_ENTRE_LOTES));
    }
  }
  
  console.log(`✓ Consulta completada: ${resultadosValidos.length} de ${fechas.length} fechas con datos`);
  
  if (resultadosValidos.length === 0) {
    throw new Error('No se encontraron datos para el rango de fechas especificado');
  }
  
  // Combinar todos los resultados
  const datosCombinados: ExtractoResponse = {
    modalidades: [],
    datosgenerales: [],
    numeros: [],
    premios: [],
    premiosganadores: []
  };
  
  resultadosValidos.forEach(resultado => {
    if (resultado.modalidades) datosCombinados.modalidades.push(...resultado.modalidades);
    if (resultado.datosgenerales) datosCombinados.datosgenerales.push(...resultado.datosgenerales);
    if (resultado.numeros) {
      // Agregar la fecha específica a cada número para rangos de fechas
      const numerosConFecha = resultado.numeros.map(numero => ({
        ...numero,
        fechaSorteo: resultado.fechaConsultada || 'N/A'
      }));
      datosCombinados.numeros.push(...numerosConFecha);
    }
    if (resultado.premios) datosCombinados.premios.push(...resultado.premios);
    if (resultado.premiosganadores) datosCombinados.premiosganadores.push(...resultado.premiosganadores);
  });
  
  console.log(`Datos combinados de ${resultadosValidos.length} fechas:`, datosCombinados);
  return datosCombinados;
}

/**
 * Genera un array de fechas en formato dd/MM/yyyy entre dos fechas
 */
function generarRangoFechas(fechaDesde: string, fechaHasta: string): string[] {
  const fechas: string[] = [];
  
  // Convertir fechas dd/MM/yyyy a Date
  const [diaDesde, mesDesde, añoDesde] = fechaDesde.split('/').map(Number);
  const [diaHasta, mesHasta, añoHasta] = fechaHasta.split('/').map(Number);
  
  const desde = new Date(añoDesde, mesDesde - 1, diaDesde);
  const hasta = new Date(añoHasta, mesHasta - 1, diaHasta);
  
  const fechaActual = new Date(desde);
  
  while (fechaActual <= hasta) {
    const dia = fechaActual.getDate().toString().padStart(2, '0');
    const mes = (fechaActual.getMonth() + 1).toString().padStart(2, '0');
    const año = fechaActual.getFullYear();
    
    fechas.push(`${dia}/${mes}/${año}`);
    
    // Avanzar un día
    fechaActual.setDate(fechaActual.getDate() + 1);
  }
  
  return fechas;
}