import { OpenAI } from 'openai';

// Función para desarrollo local
export async function callOpenAI(question: string, data: any, dateRange: any) {
  try {
    console.log('🤖 SERVICIO OPENAI - Datos recibidos:', {
      question,
      dataPresent: data ? 'Sí' : 'No',
      numerosCount: data?.numeros?.length || 0,
      dateRange
    });
    
    // Verificar que existe la API key
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('API key de OpenAI no configurada');
    }

    // Inicializar OpenAI
    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // Solo para desarrollo local
    });

    // Sistema anti-caché: cada consulta debe ser única
    const consultaId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
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

      console.log('📊 PROCESAMIENTO SIMPLIFICADO:', {
        consultaId,
        totalProcesado: estadisticasResumen.totalNumeros,
        paresCalculados: paresOrdenados.length,
        numerosRecientes: estadisticasResumen.numerosRecientes.length
      });
      
    } catch (statsError) {
      console.error('❌ ERROR al procesar estadísticas:', statsError);
      throw new Error(`Error al procesar estadísticas: ${statsError}`);
    }

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
      temperature: 0.4, // Ligeramente más alta para variación
      presence_penalty: 0.2,
      frequency_penalty: 0.2,
      user: consultaId, // Identificador único por consulta
      seed: Math.floor(Math.random() * 1000000) // Evitar caché por seed
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error('No se pudo generar una respuesta');
    }

    return {
      response,
      usage: completion.usage,
      timestamp: new Date().toISOString()
    };

  } catch (error: any) {
    console.error('Error en OpenAI Analysis:', error);
    
    // Manejo específico de errores de OpenAI
    if (error?.status === 401) {
      throw new Error('API key de OpenAI inválida');
    }
    
    if (error?.status === 429) {
      throw new Error('Límite de rate excedido. Intenta en unos minutos.');
    }

    throw new Error(error.message || 'Error al procesar la consulta');
  }
}