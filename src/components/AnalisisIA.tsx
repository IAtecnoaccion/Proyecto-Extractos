import React, { useState } from 'react';
import { ExtractoResponse } from '../types';
import { callOpenAI } from '../services/openai-local';
import './AnalisisIA.css';

interface AnalisisIAProps {
  data: ExtractoResponse | null;
  fechaDesde?: string;
  fechaHasta?: string;
}

interface Conversation {
  id: string;
  question: string;
  response: string;
  timestamp: string;
}

export const AnalisisIA: React.FC<AnalisisIAProps> = ({ data, fechaDesde, fechaHasta }) => {
  const [question, setQuestion] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estado para mantener datos de contexto persistente
  const [persistentContext, setPersistentContext] = useState<any>(null);

  const prepareDataForAI = (extractoData: ExtractoResponse) => {
    // Enviar solo datos esenciales para análisis
    const numerosCabeza = extractoData.numeros?.filter(num => (num.n_ubica || num.posicion) === 1) || [];
    const numerosEsenciales = extractoData.numeros?.slice(0, 100) || []; // Limitar para reducir tokens
    
    const preparedData = {
      // Solo números esenciales
      numerosCabeza: numerosCabeza.map(num => ({
        numero: num.n_numero || num.numero,
        fecha: num.fechaSorteo,
        modal: num.d_modal
      })),
      totalSorteos: extractoData.numeros?.length || 0,
      modalidades: [...new Set(extractoData.numeros?.map(num => num.d_modal) || [])],
      // Muestra reducida para análisis
      muestraNumeros: numerosEsenciales.map(num => ({
        numero: num.n_numero || num.numero,
        posicion: num.n_ubica || num.posicion,
        fecha: num.fechaSorteo
      }))
    };
    
    console.log('📦 DATOS OPTIMIZADOS:', {
      numerosCabeza: preparedData.numerosCabeza.length,
      totalOriginal: preparedData.totalSorteos,
      muestraEnviada: preparedData.muestraNumeros.length,
      modalidades: preparedData.modalidades.length
    });
    
    return preparedData;
  };
  
  // Actualizar contexto persistente cuando cambian los datos
  React.useEffect(() => {
    console.log('🔄 EFECTO - Verificando datos:', {
      data: data ? 'Presente' : 'Ausente',
      numerosLength: data?.numeros?.length || 0,
      fechaDesde,
      fechaHasta
    });
    
    if (data && data.numeros && data.numeros.length > 0) {
      const newContext = {
        dataProcessed: prepareDataForAI(data),
        fechaDesde,
        fechaHasta,
        lastUpdate: new Date().toISOString(),
        totalConsultas: 0
      };
      setPersistentContext(newContext);
      console.log('💾 CONTEXTO PERSISTENTE ACTUALIZADO:', newContext);
    } else {
      console.log('❌ NO SE PUEDE CREAR CONTEXTO - Datos insuficientes');
      setPersistentContext(null);
    }
  }, [data, fechaDesde, fechaHasta]);

  const suggestedQuestions = [
    "¿Cuáles son las parejas (últimas 2 cifras) más atrasadas a la cabeza?",
    "¿Qué números de 1 cifra recomiendas para apostar a los primeros 5?",
    "¿Cuáles son los mejores números de 2 cifras para a los 10?",
    "¿Qué parejas están más atrasadas en posiciones 1-5?",
    "¿Hay números terminados en 7 que no salieron a la cabeza?",
    "¿Cuál es la tendencia de números de 3 cifras en modalidad matutina?",
    "¿Qué modalidad tuvo más parejas repetidas?",
    "¿Cómo apostarías por cifras basándote en este análisis?"
  ];

  const handleAsk = async () => {
    if (!question.trim()) {
      setError('Por favor ingresa una pregunta');
      return;
    }

    // Verificar datos desde contexto persistente
    console.log('🔍 VALIDANDO CONTEXTO:', {
      persistentContext: persistentContext ? 'Presente' : 'Ausente',
      dataProcessed: persistentContext?.dataProcessed ? 'Presente' : 'Ausente',
      totalSorteos: persistentContext?.dataProcessed?.totalSorteos || 0
    });

    if (!persistentContext || !persistentContext.dataProcessed || !persistentContext.dataProcessed.totalSorteos || persistentContext.dataProcessed.totalSorteos === 0) {
      setError('No hay datos disponibles para analizar. Realiza una búsqueda primero.');
      return;
    }

    const consultaIndex = conversations.length + 1;
    const timestampConsulta = new Date().toISOString();
    
    // Actualizar contador de consultas en contexto persistente
    const contextWithCounter = {
      ...persistentContext,
      totalConsultas: consultaIndex,
      currentQuery: question
    };
    
    console.log(`🔄 CONSULTA #${consultaIndex} [${timestampConsulta}]:`, {
      pregunta: question,
      contextoPersistente: contextWithCounter,
      numerosDisponibles: contextWithCounter.dataProcessed.totalSorteos,
      fechaRange: `${contextWithCounter.fechaDesde} - ${contextWithCounter.fechaHasta}`
    });

    setLoading(true);
    setError('');

    try {
      let result;
      
      // Detectar si estamos en desarrollo local o producción
      if (import.meta.env.DEV) {
        // Usar función local para desarrollo con contexto persistente
        result = await callOpenAI(
          question,
          contextWithCounter.dataProcessed,
          {
            desde: contextWithCounter.fechaDesde,
            hasta: contextWithCounter.fechaHasta
          }
        );
      } else {
        // Usar endpoint serverless para producción con contexto persistente
        const response = await fetch('/api/openai-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question,
            data: contextWithCounter.dataProcessed,
            dateRange: {
              desde: contextWithCounter.fechaDesde,
              hasta: contextWithCounter.fechaHasta
            }
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          
          // Intentar parsear como JSON, si falla usar el texto directamente
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.error || `Error ${response.status}`);
          } catch {
            // Si no es JSON válido, usar el texto del error
            if (errorText.includes('Unauthorized')) {
              throw new Error('Error de autenticación con OpenAI. Verifica la configuración.');
            }
            throw new Error(errorText || `Error ${response.status}`);
          }
        }

        result = await response.json();
      }
      
      const newConversation: Conversation = {
        id: Date.now().toString(),
        question,
        response: result.response,
        timestamp: new Date().toLocaleString('es-AR')
      };

      setConversations(prev => [newConversation, ...prev]);
      setQuestion('');

    } catch (err: any) {
      console.error('Error al consultar IA:', err);
      
      // Mensajes de error más específicos
      let errorMessage = 'Error al procesar la consulta. Intenta nuevamente.';
      
      if (err.message.includes('API key')) {
        errorMessage = '🔑 Error de autenticación: La API key de OpenAI no es válida.';
      } else if (err.message.includes('rate')) {
        errorMessage = '⏱️ Límite de consultas excedido. Intenta en unos minutos.';
      } else if (err.message.includes('Unauthorized')) {
        errorMessage = '🚫 Error de autorización: Verifica la configuración de OpenAI.';
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage = '🌐 Error de conexión: Verifica tu conexión a internet.';
      } else if (err.message) {
        errorMessage = `❌ ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedQuestion = (suggestedQ: string) => {
    setQuestion(suggestedQ);
  };

  const clearConversations = () => {
    setConversations([]);
  };

  const hasData = persistentContext && persistentContext.dataProcessed && persistentContext.dataProcessed.totalSorteos > 0;
  const rangoFechas = fechaDesde && fechaHasta ? `${fechaDesde} al ${fechaHasta}` : 'No definido';

  return (
    <div className="analisis-ia-container">
      <div className="ia-header">
        <h2>🤖 Análisis con Inteligencia Artificial</h2>
        <div className="periodo-info">
          <span className="periodo">📅 Período analizado: {rangoFechas}</span>
          {hasData && (
            <span className="datos-info">📊 {persistentContext.dataProcessed.totalSorteos} números disponibles</span>
          )}
        </div>
      </div>

      {!hasData ? (
        <div className="no-data-ia">
          <div className="no-data-content">
            <h3>🎯 ¡Listo para analizar!</h3>
            <p>Primero realiza una búsqueda en la pestaña <strong>"Búsqueda"</strong> para obtener datos que pueda analizar la IA.</p>
            <div className="ia-tips">
              <h4>💡 ¿Qué puede hacer la IA por ti?</h4>
              <ul>
                <li>🔍 Analizar patrones ocultos en los sorteos</li>
                <li>📊 Identificar números atrasados y frecuentes</li>
                <li>🎯 Recomendar estrategias de apuesta</li>
                <li>📈 Detectar tendencias por modalidad y fecha</li>
                <li>🧮 Calcular probabilidades personalizadas</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Sección de pregunta */}
          <div className="question-section">
            <div className="input-group">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Haz una pregunta sobre los datos del sorteo... Ej: ¿Cuáles son los pares más atrasados para la cabeza?"
                rows={3}
                className="question-input"
                disabled={loading}
              />
              <button 
                onClick={handleAsk} 
                disabled={loading || !question.trim()}
                className={`ask-button ${loading ? 'loading' : ''}`}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Analizando...
                  </>
                ) : (
                  <>
                    🤖 Preguntar a la IA
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Preguntas sugeridas */}
          <div className="suggested-questions">
            <h4>💡 Preguntas sugeridas:</h4>
            <div className="suggestions-grid">
              {suggestedQuestions.map((q, i) => (
                <button 
                  key={i} 
                  onClick={() => handleSuggestedQuestion(q)} 
                  className="suggested-btn"
                  disabled={loading}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Historial de conversaciones */}
          {conversations.length > 0 && (
            <div className="conversations-section">
              <div className="conversations-header">
                <h3>💬 Historial de Análisis</h3>
                <button onClick={clearConversations} className="clear-btn">
                  🗑️ Limpiar historial
                </button>
              </div>

              <div className="conversations-list">
                {conversations.map((conv) => (
                  <div key={conv.id} className="conversation-item">
                    <div className="conversation-question">
                      <div className="question-header">
                        <span className="question-icon">❓</span>
                        <span className="question-time">{conv.timestamp}</span>
                      </div>
                      <div className="question-text">{conv.question}</div>
                    </div>
                    
                    <div className="conversation-response">
                      <div className="response-header">
                        <span className="response-icon">🤖</span>
                        <span className="response-label">Análisis de la IA</span>
                      </div>
                      <div className="response-text">
                        {conv.response.split('\n').map((line, idx) => (
                          <p key={idx}>{line}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};