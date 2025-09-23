import { ExtractoResponse, ExtractoFilters } from './types';
import { BEARER_TOKEN } from './constants';

/**
 * Realiza la consulta al API de extractos
 */
export async function fetchExtracto(filters: ExtractoFilters): Promise<ExtractoResponse> {
  const { organizacion, imputacion, fecha } = filters;
  
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
    return data;
  }
}