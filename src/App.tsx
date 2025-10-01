import { useState } from 'react';
import { ExtractoResponse, FormData, ExtractoFilters } from './types';
import { organizaciones, imputaciones } from './constants';
import { formatDateForAPI, exportToCSV } from './utils';
import { fetchExtracto } from './api';
import './App.css';

function App() {
  const [formData, setFormData] = useState<FormData>({
    organizacion: '',
    imputacion: '',
    fecha: '',
    fechaDesde: '',
    fechaHasta: '',
    tipoBusqueda: 'unica',
    d_tipo: '',
    d_modal: '',
  });
  
  const [extractoData, setExtractoData] = useState<ExtractoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: FormData) => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.organizacion || !formData.imputacion) {
      setError('Por favor complete organización e imputación');
      return;
    }
    
    // Validaciones específicas por tipo de búsqueda
    if (formData.tipoBusqueda === 'unica') {
      if (!formData.fecha) {
        setError('Por favor seleccione una fecha');
        return;
      }
    } else {
      if (!formData.fechaDesde || !formData.fechaHasta) {
        setError('Por favor seleccione fecha desde y fecha hasta');
        return;
      }
      
      // Validar que fecha desde sea menor o igual a fecha hasta
      const fechaDesde = new Date(formData.fechaDesde);
      const fechaHasta = new Date(formData.fechaHasta);
      
      if (fechaDesde > fechaHasta) {
        setError('La fecha desde debe ser menor o igual a la fecha hasta');
        return;
      }
      
      // Validar que el rango no sea mayor a 31 días para evitar demasiadas consultas
      const diffTime = Math.abs(fechaHasta.getTime() - fechaDesde.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 31) {
        setError('El rango de fechas no puede ser mayor a 31 días');
        return;
      }
    }
    
    setLoading(true);
    setError('');
    setExtractoData(null);
    
    try {
      let filters: ExtractoFilters;
      
      if (formData.tipoBusqueda === 'unica') {
        const fechaFormateada = formatDateForAPI(formData.fecha);
        console.log('Fecha original:', formData.fecha);
        console.log('Fecha formateada:', fechaFormateada);
        
        filters = {
          organizacion: parseInt(formData.organizacion),
          imputacion: parseInt(formData.imputacion),
          fecha: fechaFormateada,
          tipoBusqueda: 'unica'
        };
      } else {
        const fechaDesdeFormateada = formatDateForAPI(formData.fechaDesde);
        const fechaHastaFormateada = formatDateForAPI(formData.fechaHasta);
        
        console.log('Rango original:', formData.fechaDesde, 'a', formData.fechaHasta);
        console.log('Rango formateado:', fechaDesdeFormateada, 'a', fechaHastaFormateada);
        
        filters = {
          organizacion: parseInt(formData.organizacion),
          imputacion: parseInt(formData.imputacion),
          fechaDesde: fechaDesdeFormateada,
          fechaHasta: fechaHastaFormateada,
          tipoBusqueda: 'rango'
        };
      }
      
      console.log('Filtros enviados:', filters);
      
      const data = await fetchExtracto(filters);
      console.log('Datos recibidos:', data);
      console.log('Array de modalidades:', data.modalidades);
      console.log('Array de números:', data.numeros);
      if (data.numeros && data.numeros.length > 0) {
        console.log('Primer número:', data.numeros[0]);
        console.log('Campos disponibles en números:', Object.keys(data.numeros[0]));
      }
      if (data.modalidades && data.modalidades.length > 0) {
        console.log('Primera modalidad:', data.modalidades[0]);
        console.log('Campos disponibles en modalidades:', Object.keys(data.modalidades[0]));
      }
      setExtractoData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al consultar los datos');
    } finally {
      setLoading(false);
    }
  };
  
  const handleExportCSV = () => {
    if (!extractoData || !formData.organizacion || !formData.imputacion) {
      return;
    }
    
    if (formData.tipoBusqueda === 'unica') {
      if (!formData.fecha) return;
      
      exportToCSV(
        extractoData,
        parseInt(formData.organizacion),
        parseInt(formData.imputacion),
        formatDateForAPI(formData.fecha),
        undefined,
        undefined,
        formData.d_tipo || undefined,
        formData.d_modal || undefined
      );
    } else {
      if (!formData.fechaDesde || !formData.fechaHasta) return;
      
      exportToCSV(
        extractoData,
        parseInt(formData.organizacion),
        parseInt(formData.imputacion),
        undefined,
        formatDateForAPI(formData.fechaDesde),
        formatDateForAPI(formData.fechaHasta),
        formData.d_tipo || undefined,
        formData.d_modal || undefined
      );
    }
  };
  
  const hasData = extractoData && extractoData.numeros && extractoData.numeros.length > 0;
  
  return (
    <div className="app">
      <header className="app-header">
        <h1>Extractos de Sorteos</h1>
      </header>
      
      <main className="app-main">
        <form onSubmit={handleSubmit} className="filters-form">
          <div className="form-group">
            <label htmlFor="organizacion">Organización:</label>
            <select
              id="organizacion"
              name="organizacion"
              value={formData.organizacion}
              onChange={handleInputChange}
              required
            >
              <option value="">Seleccione una organización</option>
              {organizaciones.map(org => (
                <option key={org.codigo} value={org.codigo}>
                  {org.codigo} - {org.nombre}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="imputacion">Imputación:</label>
            <select
              id="imputacion"
              name="imputacion"
              value={formData.imputacion}
              onChange={handleInputChange}
              required
            >
              <option value="">Seleccione una imputación</option>
              {imputaciones.map(imp => (
                <option key={imp.codigo} value={imp.codigo}>
                  {imp.codigo} - {imp.nombre}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="tipoBusqueda">Tipo de búsqueda:</label>
            <select
              id="tipoBusqueda"
              name="tipoBusqueda"
              value={formData.tipoBusqueda}
              onChange={handleInputChange}
              required
            >
              <option value="unica">Fecha única</option>
              <option value="rango">Rango de fechas</option>
            </select>
          </div>
          
          {formData.tipoBusqueda === 'unica' ? (
            <div className="form-group">
              <label htmlFor="fecha">Fecha:</label>
              <input
                type="date"
                id="fecha"
                name="fecha"
                value={formData.fecha}
                onChange={handleInputChange}
                required
              />
            </div>
          ) : (
            <div className="form-group-row">
              <div className="form-group">
                <label htmlFor="fechaDesde">Fecha desde:</label>
                <input
                  type="date"
                  id="fechaDesde"
                  name="fechaDesde"
                  value={formData.fechaDesde}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="fechaHasta">Fecha hasta:</label>
                <input
                  type="date"
                  id="fechaHasta"
                  name="fechaHasta"
                  value={formData.fechaHasta}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          )}
          
          <div className="form-actions">
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
            
            {hasData && (
              <button
                type="button"
                onClick={handleExportCSV}
                className="btn btn-secondary"
              >
                Exportar CSV
              </button>
            )}
          </div>
        </form>
        
        {/* Filtros adicionales - solo se muestran si hay datos */}
        {extractoData && extractoData.numeros && extractoData.numeros.length > 0 && (
          <div className="additional-filters">
            <h3>Filtros de Resultados</h3>
            <div className="filters-row">
              <div className="form-group">
                <label htmlFor="d_tipo">Jurisdicción:</label>
                <select
                  id="d_tipo"
                  name="d_tipo"
                  value={formData.d_tipo}
                  onChange={handleInputChange}
                >
                  <option value="">Todas las jurisdicciones</option>
                  {[...new Set(extractoData.numeros.map(num => num.d_tipo).filter(Boolean))].map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="d_modal">Modalidad:</label>
                <select
                  id="d_modal"
                  name="d_modal"
                  value={formData.d_modal}
                  onChange={handleInputChange}
                >
                  <option value="">Todas las modalidades</option>
                  {[...new Set(extractoData.numeros.map(num => num.d_modal).filter(Boolean))].map(modal => (
                    <option key={modal} value={modal}>{modal}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}
        
        {extractoData && (
          <div className="results">
            {/* Resultados de números */}
            {extractoData.numeros && extractoData.numeros.length > 0 ? (
              <div className="section">
                <h3>Resultados</h3>
                {(() => {
                  // Aplicar filtros locales
                  let numerosFiltrados = extractoData.numeros;
                  
                  if (formData.d_tipo) {
                    numerosFiltrados = numerosFiltrados.filter(num => num.d_tipo === formData.d_tipo);
                  }
                  
                  if (formData.d_modal) {
                    numerosFiltrados = numerosFiltrados.filter(num => num.d_modal === formData.d_modal);
                  }
                  
                  console.log('Números filtrados:', numerosFiltrados);
                  console.log('Filtros aplicados:', { d_tipo: formData.d_tipo, d_modal: formData.d_modal });
                  
                  if (numerosFiltrados.length === 0) {
                    return <p className="no-results">Sin resultados para los filtros seleccionados</p>;
                  }
                  
                  return (
                    <div className="table-container">
                      <table className="results-table">
                        <thead>
                          <tr>
                            <th>Posición</th>
                            <th>Número</th>
                            <th>Fecha</th>
                            <th>Jurisdicción</th>
                            <th>Modalidad</th>
                          </tr>
                        </thead>
                        <tbody>
                          {numerosFiltrados.slice(0, 50).map((num, index) => (
                            <tr key={index}>
                              <td>{num.n_ubica || num.posicion || index + 1}</td>
                              <td>{num.n_numero || num.numero}</td>
                              <td>{num.fechaSorteo || '-'}</td>
                              <td>{num.d_tipo || '-'}</td>
                              <td>{num.d_modal || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {numerosFiltrados.length > 50 && (
                        <p className="info">Mostrando los primeros 50 resultados de {numerosFiltrados.length} total</p>
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="section">
                <p className="no-results">Sin resultados para los filtros seleccionados</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;