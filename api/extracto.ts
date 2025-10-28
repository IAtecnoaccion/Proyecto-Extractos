import type { VercelRequest, VercelResponse } from '@vercel/node';

// Caché en memoria (se resetea cada vez que se redeploya)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

// Rate limiting simple (en memoria)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 50; // 50 peticiones por hora por IP
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hora

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo permitir GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Obtener IP del cliente
  const clientIP = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                   (req.headers['x-real-ip'] as string) || 
                   'unknown';

  // === RATE LIMITING ===
  const now = Date.now();
  const rateLimitData = rateLimitMap.get(clientIP);

  if (rateLimitData) {
    // Si la ventana expiró, resetear
    if (now > rateLimitData.resetTime) {
      rateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    } else {
      // Incrementar contador
      rateLimitData.count++;
      
      // Si excede el límite
      if (rateLimitData.count > RATE_LIMIT) {
        const resetIn = Math.ceil((rateLimitData.resetTime - now) / 60000); // minutos
        return res.status(429).json({ 
          error: 'Límite de peticiones excedido',
          message: `Has excedido el límite de ${RATE_LIMIT} búsquedas por hora. Intenta nuevamente en ${resetIn} minutos.`,
          retryAfter: resetIn
        });
      }
    }
  } else {
    // Primera petición de esta IP
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
  }

  // Obtener parámetros
  const { organizacion, imputacion, fechasorteo } = req.query;

  // Validar parámetros requeridos
  if (!organizacion || !imputacion || !fechasorteo) {
    return res.status(400).json({ 
      error: 'Parámetros faltantes',
      required: ['organizacion', 'imputacion', 'fechasorteo']
    });
  }

  // === CACHÉ ===
  const cacheKey = `${organizacion}-${imputacion}-${fechasorteo}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
    console.log(`✓ Caché HIT: ${cacheKey}`);
    return res.status(200).json({
      ...cachedData.data,
      _cached: true,
      _cacheAge: Math.floor((now - cachedData.timestamp) / 1000 / 60) // minutos
    });
  }

  // === LLAMADA A LA API EXTERNA ===
  try {
    const apiUrl = `https://lotemovil.tecnoaccion.com.ar/api/public/${organizacion}/extracto?imputacion=${imputacion}&fechasorteo=${fechasorteo}`;
    
    console.log(`→ Llamando API externa: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.BEARER_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`✗ Error API: ${response.status} ${response.statusText}`);
      
      // Si es 500, probablemente no hay datos para esa fecha
      if (response.status === 500) {
        return res.status(200).json({
          numeros: [],
          modalidades: [],
          datosgenerales: [],
          premios: [],
          premiosganadores: [],
          _noData: true
        });
      }
      
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Guardar en caché
    cache.set(cacheKey, { data, timestamp: now });
    console.log(`✓ Guardado en caché: ${cacheKey}`);

    // Limpiar caché viejo (cada 100 peticiones)
    if (cache.size > 100) {
      const entriesToDelete: string[] = [];
      cache.forEach((value, key) => {
        if ((now - value.timestamp) > CACHE_DURATION) {
          entriesToDelete.push(key);
        }
      });
      entriesToDelete.forEach(key => cache.delete(key));
      console.log(`🗑️ Limpieza de caché: ${entriesToDelete.length} entradas eliminadas`);
    }

    return res.status(200).json({
      ...data,
      _cached: false
    });

  } catch (error) {
    console.error('Error en proxy:', error);
    return res.status(500).json({ 
      error: 'Error al consultar datos',
      message: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}
