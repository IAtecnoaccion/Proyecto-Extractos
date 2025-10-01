import { OpenAI } from 'openai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Permitir solo métodos POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Verificar que existe la API key
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'API key de OpenAI no configurada' });
    }

    // Sistema anti-caché: cada consulta debe ser única
    const consultaId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Inicializar OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { question, data, dateRange } = req.body;

    // Validar entrada
    if (!question || !data) {
      return res.status(400).json({ error: 'Pregunta y datos son requeridos' });
    }

    console.log('🤖 SERVERLESS OPENAI - Datos recibidos:', {
      consultaId,
      question,
      dataPresent: data ? 'Sí' : 'No',
      numerosCount: data?.totalSorteos || 0,
      dateRange
    });

    // Procesamiento simplificado de datos optimizados
    let estadisticasResumen: any;
    
    try {
      // Trabajar con datos ya optimizados del componente
      const numerosCabeza = data.numerosCabeza || [];
      const modalidades = data.modalidades || [];
      
      // Análisis de pares desde datos de cabeza
      const paresEnCabeza = numerosCabeza.map((item: any) => {
        const numero = String(item.numero).padStart(4, '0');
        return numero.slice(-2); // Últimas 2 cifras
      });

      // Conteo de frecuencias
      const frecuenciaPares = paresEnCabeza.reduce((acc: any, par: string) => {
        acc[par] = (acc[par] || 0) + 1;
        return acc;
      }, {});

      const paresOrdenados = Object.entries(frecuenciaPares)
        .sort(([,a]: any, [,b]: any) => b - a)
        .slice(0, 8); // Solo top 8 para reducir tokens

      estadisticasResumen = {
        totalNumeros: data.totalSorteos,
        fechaDesde: dateRange?.desde || 'N/A',
        fechaHasta: dateRange?.hasta || 'N/A',
        numerosCabeza: numerosCabeza.length,
        modalidades: modalidades.join(', '),
        paresTop: paresOrdenados,
        // Muestra de números recientes a la cabeza
        numerosRecientes: numerosCabeza.slice(0, 10).map((item: any) => item.numero)
      };

      console.log('📊 PROCESAMIENTO SIMPLIFICADO [SERVERLESS]:', {
        consultaId,
        totalProcesado: estadisticasResumen.totalNumeros,
        paresCalculados: paresOrdenados.length,
        numerosRecientes: estadisticasResumen.numerosRecientes.length
      });
      
    } catch (statsError) {
      console.error('❌ ERROR al procesar estadísticas:', statsError);
      throw new Error(`Error al procesar estadísticas: ${statsError}`);
    }

    // Contexto especializado para análisis de lotería con sistema anti-caché
    const systemPrompt = `Experto Quiniela Argentina. RESPONDE DIRECTO, SIN EXPLICACIONES.

[${consultaId}] Período: ${estadisticasResumen.fechaDesde}-${estadisticasResumen.fechaHasta}

DATOS:
- Total: ${estadisticasResumen.totalNumeros} números
- Cabeza: ${estadisticasResumen.numerosCabeza} números
- Modalidades: ${estadisticasResumen.modalidades}

NÚMEROS CABEZA RECIENTES: ${estadisticasResumen.numerosRecientes.join(', ')}

PARES TOP (últimas 2 cifras): ${estadisticasResumen.paresTop.map(([par, freq]: any) => `${par}:${freq}`).join(', ')}

REGLAS: Parejas=últimas 2 cifras. Cabeza=pos1, Primeros5=pos1-5, Los10=pos1-10

RESPONDE SOLO lo pedido. Sin "recomiendo" ni explicaciones.`;

    // Llamada a OpenAI con parámetros anti-caché
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `[CONSULTA ${consultaId}] ${question}` }
      ],
      max_tokens: 600, // Reducido para respuestas más concisas
      temperature: 0.4,
      presence_penalty: 0.2,
      frequency_penalty: 0.2,
      user: consultaId,
      seed: Math.floor(Math.random() * 1000000)
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      return res.status(500).json({ error: 'No se pudo generar una respuesta' });
    }

    // Configurar headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    return res.status(200).json({ 
      response,
      usage: completion.usage,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error en OpenAI Analysis:', error);
    
    // Manejo específico de errores de OpenAI
    if (error?.status === 401) {
      return res.status(401).json({ error: 'API key de OpenAI inválida' });
    }
    
    if (error?.status === 429) {
      return res.status(429).json({ error: 'Límite de rate excedido. Intenta en unos minutos.' });
    }

    return res.status(500).json({ 
      error: error.message || 'Error al procesar la consulta' 
    });
  }
}

// Configuración de Vercel para esta función
export const config = {
  runtime: 'nodejs18.x',
  maxDuration: 30,
  regions: ['cle1']
};