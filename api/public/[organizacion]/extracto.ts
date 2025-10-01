import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { organizacion } = req.query;
    const { imputacion, fechasorteo } = req.query;

    if (!organizacion || !imputacion || !fechasorteo) {
      return res.status(400).json({ 
        error: 'Missing required parameters: organizacion, imputacion, fechasorteo' 
      });
    }

    // Bearer token desde variables de entorno (más seguro) o fallback
    const BEARER_TOKEN = process.env.BEARER_TOKEN || 'pLvSbEk6k3EXgG7H3L5wwSMgJueXt4csM5kM6JyhOM2mYG3LkJGdzTewK7CyXiDr';

    // URL exacta de la API de lotemovil
    const apiUrl = `https://lotemovil.tecnoaccion.com.ar/api/public/${organizacion}/extracto?imputacion=${imputacion}&fechasorteo=${encodeURIComponent(fechasorteo as string)}`;
    
    console.log('Serverless function - Fetching from:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'VercelServerless/1.0',
      },
    });

    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      return res.status(response.status).json({ 
        error: `API Error: ${response.status} ${response.statusText}` 
      });
    }

    const data = await response.json();
    console.log('Serverless function - API Response received successfully');
    
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('Serverless function - Proxy Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}