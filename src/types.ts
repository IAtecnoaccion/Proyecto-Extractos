export interface ExtractoResponse {
  modalidades: any[];
  datosgenerales: any[];
  numeros: Array<{
    d_modal?: string; // nombre de la modalidad
    d_tipo?: string; // jurisdicción del sorteo
    modalidad?: string; // fallback
    n_ubica?: number | string;
    n_numero?: number | string;
    posicion?: number | string; // fallback
    numero?: number | string; // fallback
    [k: string]: any;
  }>;
  premios: any[];
  premiosganadores: any[];
  [k: string]: any;
}

export interface Organizacion {
  codigo: number;
  nombre: string;
}

export interface Imputacion {
  codigo: number;
  nombre: string;
}

export interface ExtractoFilters {
  organizacion: number;
  imputacion: number;
  fecha: string; // formato dd/MM/yyyy
}

export interface FormData {
  organizacion: string;
  imputacion: string;
  fecha: string; // formato YYYY-MM-DD del input type="date"
  d_tipo: string; // filtro de jurisdicción
  d_modal: string; // filtro de modalidad
}