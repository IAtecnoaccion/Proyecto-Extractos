import React from 'react';
import { ExtractoResponse } from '../types';
import './Estadisticas.css';

interface EstadisticasProps {
  data: ExtractoResponse | null;
  fechaDesde?: string;
  fechaHasta?: string;
}

interface EstadisticaNumero {
  numero: string;
  frecuencia: number;
  posiciones: number[];
  fechas: string[];
  porcentaje: number;
}

interface EstadisticaPosicion {
  posicion: number;
  numerosFrecuentes: EstadisticaNumero[];
  numerosRaros: EstadisticaNumero[];
  totalSorteos: number;
}

interface EstadisticaRango {
  nombre: string;
  rango: string;
  paresFrecuentes: EstadisticaNumero[];
  paresRaros: EstadisticaNumero[];
  totalSorteos: number;
}

export const Estadisticas: React.FC<EstadisticasProps> = ({ data, fechaDesde, fechaHasta }) => {
  if (!data || !data.numeros || data.numeros.length === 0) {
    return (
      <div className="estadisticas-container">
        <div className="no-data">
          <h3>📊 No hay datos para generar estadísticas</h3>
          <p>Realiza una búsqueda por <strong>rango de fechas</strong> para ver las estadísticas detalladas.</p>
          <div className="no-data-tips">
            <h4>💡 ¿Qué verás en las estadísticas?</h4>
            <ul>
              <li>🔥 Números que más salieron por posición</li>
              <li>❄️ Números que menos salieron por posición</li>
              <li>📊 Frecuencias y porcentajes detallados</li>
              <li>📅 Análisis por fecha y modalidad</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Función para extraer pares de dígitos de un número
  const extraerPares = (numero: string): string[] => {
    const numStr = numero.toString().padStart(4, '0'); // Asegurar al menos 4 dígitos
    
    // En Quiniela/Tombola, el par ganador son los ÚLTIMOS 2 dígitos
    // Por ejemplo: 1425 → par ganador es "25", no "14"
    const ultimosPar = numStr.slice(-2); // Tomar los últimos 2 dígitos
    
    return [ultimosPar];
  };

  // Análisis por rangos de posiciones
  const analisisPorRangos = (): EstadisticaRango[] => {
    const rangos = [
      { nombre: "A la cabeza", rango: "1°", posiciones: [1] },
      { nombre: "A los 5", rango: "1° - 5°", posiciones: [1, 2, 3, 4, 5] },
      { nombre: "A los 10", rango: "1° - 10°", posiciones: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
      { nombre: "A los 20", rango: "1° - 20°", posiciones: Array.from({length: 20}, (_, i) => i + 1) }
    ];

    return rangos.map(({ nombre, rango, posiciones }) => {
      const paresMap = new Map<string, EstadisticaNumero>();
      let totalSorteos = 0;

      // Filtrar números por rango de posiciones
      data.numeros.forEach(item => {
        const numero = (item.n_numero || item.numero || '').toString();
        const posicion = parseInt((item.n_ubica || item.posicion || '0').toString());
        const fecha = item.fechaSorteo || 'N/A';

        if (numero && posiciones.includes(posicion)) {
          totalSorteos++;
          
          // Extraer pares del número
          const pares = extraerPares(numero);
          
          pares.forEach(par => {
            if (!paresMap.has(par)) {
              paresMap.set(par, {
                numero: par,
                frecuencia: 0,
                posiciones: [],
                fechas: [],
                porcentaje: 0
              });
            }

            const stat = paresMap.get(par)!;
            stat.frecuencia++;
            if (!stat.posiciones.includes(posicion)) {
              stat.posiciones.push(posicion);
            }
            if (!stat.fechas.includes(fecha)) {
              stat.fechas.push(fecha);
            }
          });
        }
      });

      // Convertir a array y calcular porcentajes
      const paresArray = Array.from(paresMap.values()).map(stat => ({
        ...stat,
        porcentaje: totalSorteos > 0 ? (stat.frecuencia / totalSorteos) * 100 : 0
      }));

      // Ordenar por frecuencia
      paresArray.sort((a, b) => b.frecuencia - a.frecuencia);

      return {
        nombre,
        rango,
        paresFrecuentes: paresArray.slice(0, 10), // Top 10 más frecuentes
        paresRaros: paresArray.slice(-10).reverse(), // Top 10 menos frecuentes
        totalSorteos
      };
    });
  };

  // Análisis por posición con pares de dígitos
  const analisisPorPosicion = (): EstadisticaPosicion[] => {
    const posicionMap = new Map<number, Map<string, EstadisticaNumero>>();
    const totalPorPosicion = new Map<number, number>();
    
    // Recopilar datos por posición usando pares de dígitos
    data.numeros.forEach(item => {
      const numero = (item.n_numero || item.numero || '').toString();
      const posicion = parseInt((item.n_ubica || item.posicion || '0').toString());
      const fecha = item.fechaSorteo || 'N/A';
      
      if (numero && posicion > 0) {
        // Inicializar mapa de posición si no existe
        if (!posicionMap.has(posicion)) {
          posicionMap.set(posicion, new Map());
          totalPorPosicion.set(posicion, 0);
        }
        
        // Incrementar total por posición (una vez por sorteo)
        totalPorPosicion.set(posicion, totalPorPosicion.get(posicion)! + 1);
        
        const paresEnPosicion = posicionMap.get(posicion)!;
        
        // Extraer pares del número y analizarlos
        const pares = extraerPares(numero);
        
        pares.forEach(par => {
          if (!paresEnPosicion.has(par)) {
            paresEnPosicion.set(par, {
              numero: par,
              frecuencia: 0,
              posiciones: [posicion],
              fechas: [],
              porcentaje: 0
            });
          }

          const stat = paresEnPosicion.get(par)!;
          stat.frecuencia++;
          if (!stat.fechas.includes(fecha)) {
            stat.fechas.push(fecha);
          }
        });
      }
    });

    // Calcular porcentajes y crear estadísticas por posición
    const resultado: EstadisticaPosicion[] = [];
    
    posicionMap.forEach((paresMap, posicion) => {
      const totalSorteos = totalPorPosicion.get(posicion) || 0;
      
      // Convertir a array y calcular porcentajes
      const paresArray = Array.from(paresMap.values()).map(stat => ({
        ...stat,
        porcentaje: totalSorteos > 0 ? (stat.frecuencia / totalSorteos) * 100 : 0
      }));
      
      // Ordenar por frecuencia
      paresArray.sort((a, b) => b.frecuencia - a.frecuencia);
      
      resultado.push({
        posicion,
        numerosFrecuentes: paresArray.slice(0, 10), // Top 10 más frecuentes
        numerosRaros: paresArray.slice(-10).reverse(), // Top 10 menos frecuentes
        totalSorteos
      });
    });

    return resultado.sort((a, b) => a.posicion - b.posicion);
  };

  // Análisis general de números
  const analisisGeneral = () => {
    const numeroMap = new Map<string, EstadisticaNumero>();
    const pareMap = new Map<string, EstadisticaNumero>();
    const totalNumeros = data.numeros.length;
    
    data.numeros.forEach(item => {
      const numero = (item.n_numero || item.numero || '').toString();
      const posicion = parseInt((item.n_ubica || item.posicion || '0').toString());
      const fecha = item.fechaSorteo || 'N/A';
      
      if (numero) {
        // Análisis de números completos
        if (!numeroMap.has(numero)) {
          numeroMap.set(numero, {
            numero,
            frecuencia: 0,
            posiciones: [],
            fechas: [],
            porcentaje: 0
          });
        }
        
        const stat = numeroMap.get(numero)!;
        stat.frecuencia++;
        if (posicion && !stat.posiciones.includes(posicion)) {
          stat.posiciones.push(posicion);
        }
        if (fecha && !stat.fechas.includes(fecha)) {
          stat.fechas.push(fecha);
        }

        // Análisis de pares (últimos 2 dígitos)
        const pares = extraerPares(numero);
        pares.forEach(par => {
          if (!pareMap.has(par)) {
            pareMap.set(par, {
              numero: par,
              frecuencia: 0,
              posiciones: [],
              fechas: [],
              porcentaje: 0
            });
          }
          
          const statPar = pareMap.get(par)!;
          statPar.frecuencia++;
          if (posicion && !statPar.posiciones.includes(posicion)) {
            statPar.posiciones.push(posicion);
          }
          if (fecha && !statPar.fechas.includes(fecha)) {
            statPar.fechas.push(fecha);
          }
        });
      }
    });
    
    // Calcular porcentajes para números
    const numerosArray = Array.from(numeroMap.values()).map(stat => ({
      ...stat,
      porcentaje: (stat.frecuencia / totalNumeros) * 100
    }));

    // Calcular porcentajes para pares
    const paresArray = Array.from(pareMap.values()).map(stat => ({
      ...stat,
      porcentaje: (stat.frecuencia / totalNumeros) * 100
    }));

    const paresMasFrecuentes = paresArray.sort((a, b) => b.frecuencia - a.frecuencia);
    const paresMenosFreuentes = paresArray.sort((a, b) => a.frecuencia - b.frecuencia);
    
    return {
      todosMasFrecuentes: numerosArray.sort((a, b) => b.frecuencia - a.frecuencia).slice(0, 10),
      todosMenosFreuentes: numerosArray.sort((a, b) => a.frecuencia - b.frecuencia).slice(0, 10),
      totalNumeros,
      numerosUnicos: numerosArray.length,
      paresUnicos: paresArray.length,
      parMasFrecuente: paresMasFrecuentes[0],
      parMenosFreuente: paresMenosFreuentes[0]
    };
  };

  const estadisticasPosicion = analisisPorPosicion();
  const estadisticasGenerales = analisisGeneral();
  const estadisticasRangos = analisisPorRangos();
  
  const rangoFechas = fechaDesde && fechaHasta ? `${fechaDesde} al ${fechaHasta}` : 'N/A';

  return (
    <div className="estadisticas-container">
      <div className="estadisticas-header">
        <h2>📊 Estadísticas de Sorteos</h2>
        <div className="periodo-info">
          <span className="periodo">📅 Período: {rangoFechas}</span>
        </div>
      </div>

      <div className="estadisticas-grid">
        {/* Números Más Frecuentes Generales */}
        <div className="estadistica-section">
          <h3>🔥 Top 10 - Números Más Frecuentes</h3>
          <div className="tabla-estadisticas">
            <div className="tabla-header">
              <span>Número</span>
              <span>Frecuencia</span>
              <span>Última fecha</span>
            </div>
            {estadisticasGenerales.todosMasFrecuentes.map((stat, index) => {
              // Obtener la fecha más reciente
              const fechaMasReciente = stat.fechas.sort((a, b) => 
                new Date(b.split('/').reverse().join('-')).getTime() - 
                new Date(a.split('/').reverse().join('-')).getTime()
              )[0];
              
              return (
                <div key={stat.numero} className="tabla-row">
                  <span className="numero-destacado">#{index + 1} {stat.numero}</span>
                  <span className="frecuencia-alta">{stat.frecuencia}</span>
                  <span className="fecha">{fechaMasReciente || 'N/A'}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Números Menos Frecuentes Generales */}
        <div className="estadistica-section">
          <h3>❄️ Top 10 - Números Menos Frecuentes</h3>
          <div className="tabla-estadisticas">
            <div className="tabla-header">
              <span>Número</span>
              <span>Frecuencia</span>
              <span>Última fecha</span>
            </div>
            {estadisticasGenerales.todosMenosFreuentes.map((stat, index) => {
              // Obtener la fecha más reciente
              const fechaMasReciente = stat.fechas.sort((a, b) => 
                new Date(b.split('/').reverse().join('-')).getTime() - 
                new Date(a.split('/').reverse().join('-')).getTime()
              )[0];
              
              return (
                <div key={stat.numero} className="tabla-row">
                  <span className="numero-raro">#{index + 1} {stat.numero}</span>
                  <span className="frecuencia-baja">{stat.frecuencia}</span>
                  <span className="fecha">{fechaMasReciente || 'N/A'}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Análisis por Rangos de Posiciones */}
      <div className="analisis-rangos">
        <h2>🎯 Análisis por Rangos de Posiciones</h2>
        <div className="rangos-grid">
          {estadisticasRangos.map((rango, index) => (
            <div key={index} className="rango-card">
              <div className="rango-header">
                <h3>{rango.nombre}</h3>
                <span className="rango-posiciones">{rango.rango}</span>
              </div>
              
              <div className="rango-info">
                <span className="total-sorteos">Total sorteos: {rango.totalSorteos}</span>
              </div>

              <div className="rango-analisis">
                <div className="pares-frecuentes-section">
                  <h4>🔥 Pares Más Salidores</h4>
                  <div className="pares-tabla">
                    <div className="pares-header">
                      <span>Par</span>
                      <span>Frecuencia</span>
                      <span>Última fecha</span>
                    </div>
                    {rango.paresFrecuentes.slice(0, 5).map((stat) => {
                      const fechaMasReciente = stat.fechas.sort((a, b) => 
                        new Date(b.split('/').reverse().join('-')).getTime() - 
                        new Date(a.split('/').reverse().join('-')).getTime()
                      )[0];
                      return (
                        <div key={stat.numero} className="pares-row">
                          <span className="par-numero-highlight">{stat.numero}</span>
                          <span className="par-freq">{stat.frecuencia}</span>
                          <span className="fecha">{fechaMasReciente || 'N/A'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pares-raros-section">
                  <h4>❄️ Pares Más Atrasados</h4>
                  <div className="pares-tabla">
                    <div className="pares-header">
                      <span>Par</span>
                      <span>Frecuencia</span>
                      <span>Última fecha</span>
                    </div>
                    {rango.paresRaros.slice(0, 5).map((stat) => {
                      const fechaMasReciente = stat.fechas.sort((a, b) => 
                        new Date(b.split('/').reverse().join('-')).getTime() - 
                        new Date(a.split('/').reverse().join('-')).getTime()
                      )[0];
                      return (
                        <div key={stat.numero} className="pares-row">
                          <span className="par-numero-highlight">{stat.numero}</span>
                          <span className="par-freq">{stat.frecuencia}</span>
                          <span className="fecha">{fechaMasReciente || 'N/A'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Análisis por Posición */}
      <div className="analisis-posiciones">
        <h2>📍 Análisis de Pares por Posición</h2>
        <div className="posiciones-grid">
          {estadisticasPosicion.map((posicion) => (
            <div key={posicion.posicion} className="posicion-card">
              <h3>Posición {posicion.posicion}</h3>
              <div className="posicion-info">
                <span className="total-sorteos">Total sorteos: {posicion.totalSorteos}</span>
              </div>

              <div className="posicion-analisis">
                <div className="frecuentes-section">
                  <h4>🔥 Pares Más Frecuentes</h4>
                  <div className="pares-tabla">
                    <div className="pares-header">
                      <span>Par</span>
                      <span>Frecuencia</span>
                      <span>Última fecha</span>
                    </div>
                    {posicion.numerosFrecuentes.map((stat) => {
                      const fechaMasReciente = stat.fechas.sort((a, b) => 
                        new Date(b.split('/').reverse().join('-')).getTime() - 
                        new Date(a.split('/').reverse().join('-')).getTime()
                      )[0];
                      return (
                        <div key={stat.numero} className="pares-row">
                          <span className="par-numero-highlight">{stat.numero}</span>
                          <span className="par-freq">{stat.frecuencia}</span>
                          <span className="fecha">{fechaMasReciente || 'N/A'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="raros-section">
                  <h4>❄️ Pares Menos Frecuentes</h4>
                  <div className="pares-tabla">
                    <div className="pares-header">
                      <span>Par</span>
                      <span>Frecuencia</span>
                      <span>Última fecha</span>
                    </div>
                    {posicion.numerosRaros.map((stat) => {
                      const fechaMasReciente = stat.fechas.sort((a, b) => 
                        new Date(b.split('/').reverse().join('-')).getTime() - 
                        new Date(a.split('/').reverse().join('-')).getTime()
                      )[0];
                      return (
                        <div key={stat.numero} className="pares-row">
                          <span className="par-numero-highlight">{stat.numero}</span>
                          <span className="par-freq">{stat.frecuencia}</span>
                          <span className="fecha">{fechaMasReciente || 'N/A'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};