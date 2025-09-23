import { Organizacion, Imputacion } from './types';

export const organizaciones: Organizacion[] = [
  { codigo: 1, nombre: 'Neuquén' },
  { codigo: 2, nombre: 'La Rioja' },
  { codigo: 3, nombre: 'La Pampa' },
  { codigo: 4, nombre: 'Corrientes' },
  { codigo: 5, nombre: 'Río Negro' },
  { codigo: 6, nombre: 'Salta' },
  { codigo: 7, nombre: 'Santiago del Estero' },
  { codigo: 10, nombre: 'Jujuy' },
  { codigo: 12, nombre: 'Tierra del Fuego' },
  { codigo: 14, nombre: 'Catamarca' },
];

export const imputaciones: Imputacion[] = [
  { codigo: 0, nombre: 'Quiniela / Tómbola' },
  { codigo: 3, nombre: 'Loto' },
  { codigo: 4, nombre: 'Quini 6' },
  { codigo: 6, nombre: 'Pozo Quiniela' },
  { codigo: 7, nombre: 'Brinco' },
  { codigo: 9, nombre: 'Loto 5' },
  { codigo: 10, nombre: 'Lotería' },
  { codigo: 21, nombre: 'Patagonia Telebingo' },
  { codigo: 25, nombre: 'Telekino Automatizado' },
];

export const BEARER_TOKEN = 'pLvSbEk6k3EXgG7H3L5wwSMgJueXt4csM5kM6JyhOM2mYG3LkJGdzTewK7CyXiDr';