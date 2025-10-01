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
  
  // Intentar primero con el API directo
  const urlDirect = `https://lotemovil.tecnoaccion.com.ar/api/public/${organizacion}/extracto?imputacion=${imputacion}&fechasorteo=${encodeURIComponent(fecha)}`;
  
  // URL alternativa usando proxy local si hay CORS
  const urlProxy = `/api/public/${organizacion}/extracto?imputacion=${imputacion}&fechasorteo=${encodeURIComponent(fecha)}`;
  
  console.log('Fecha enviada al API:', fecha);
  console.log('URL directa:', urlDirect);
  console.log('URL proxy:', urlProxy);
  
  try {
    // Intentar primero el API directo
    console.log('Intentando llamada directa...');
    const response = await fetch(urlDirect, {
      method: 'GET',
      headers: {
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
    console.log('Error con llamada directa, intentando con proxy...', error);
    
    // Si falla, intentar con proxy
    const responseProxy = await fetch(urlProxy, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!responseProxy.ok) {
      throw new Error(`Error ${responseProxy.status}: ${responseProxy.statusText}`);
    }
    
    const data = await responseProxy.json();
    console.log('Respuesta exitosa con proxy:', data);
    
    // Agregar la fecha consultada a cada número para búsquedas únicas (proxy)
    if (data.numeros && Array.isArray(data.numeros)) {
      data.numeros = data.numeros.map((numero: any) => ({
        ...numero,
        fechaSorteo: fecha
      }));
    }
    
    return data;
  }
}

/**
 * Consulta extracto para un rango de fechas
 */
async function fetchExtractoRango(filters: ExtractoFilters): Promise<ExtractoResponse> {
  const { organizacion, imputacion, fechaDesde, fechaHasta } = filters;
  
  if (!fechaDesde || !fechaHasta) {
    throw new Error('Fecha desde y fecha hasta son requeridas para búsqueda por rango');
  }
  
  console.log('Buscando extractos en rango:', fechaDesde, 'a', fechaHasta);
  
  // Generar array de fechas en el rango
  const fechas = generarRangoFechas(fechaDesde, fechaHasta);
  console.log('Fechas a consultar:', fechas);
  
  // Realizar consultas para cada fecha
  const promesas = fechas.map(fecha => 
    fetchExtractoUnico({
      organizacion,
      imputacion,
      fecha,
      tipoBusqueda: 'unica'
    }).then(resultado => {
      // Agregar la fecha consultada al resultado
      if (resultado) {
        resultado.fechaConsultada = fecha;
      }
      return resultado;
    }).catch(error => {
      console.warn(`Error consultando fecha ${fecha}:`, error);
      return null; // Retornar null en caso de error para esa fecha
    })
  );
  
  const resultados = await Promise.all(promesas);
  
  // Filtrar resultados nulos y combinar datos
  const resultadosValidos = resultados.filter(resultado => resultado !== null) as ExtractoResponse[];
  
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