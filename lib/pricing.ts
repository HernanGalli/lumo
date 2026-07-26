// Funciones puras de cálculo de costos y precios. Sin dependencias de
// Supabase/React para que sean fáciles de testear y reutilizar tanto en el
// formulario de la calculadora como en la generación de presupuestos.

export interface CalculoCostoInput {
  pesoGramos: number;
  costoPorKg: number;
  tiempoHoras: number;
  consumoWatts: number;
  tarifaUteKwh: number;
  tiempoDisenoHoras?: number;
  valorHora?: number;
}

export interface CalculoCostoBreakdown {
  costoMaterial: number;
  costoEnergia: number;
  costoManoObra: number;
  costoTotal: number;
}

export function calcCostoMaterial(pesoGramos: number, costoPorKg: number): number {
  return (pesoGramos / 1000) * costoPorKg;
}

export function calcCostoEnergia(
  consumoWatts: number,
  tiempoHoras: number,
  tarifaUteKwh: number
): number {
  return (consumoWatts / 1000) * tiempoHoras * tarifaUteKwh;
}

export function calcCostoManoObra(tiempoDisenoHoras: number, valorHora: number): number {
  return tiempoDisenoHoras * valorHora;
}

export function calcCostoBreakdown(input: CalculoCostoInput): CalculoCostoBreakdown {
  const costoMaterial = calcCostoMaterial(input.pesoGramos, input.costoPorKg);
  const costoEnergia = calcCostoEnergia(
    input.consumoWatts,
    input.tiempoHoras,
    input.tarifaUteKwh
  );
  const costoManoObra = calcCostoManoObra(
    input.tiempoDisenoHoras ?? 0,
    input.valorHora ?? 0
  );
  const costoTotal = costoMaterial + costoEnergia + costoManoObra;

  return { costoMaterial, costoEnergia, costoManoObra, costoTotal };
}

export function calcPrecioSugerido(costoTotal: number, margenPct: number): number {
  return costoTotal * (1 + margenPct / 100);
}

export interface TierRule {
  minQty: number;
  maxQty: number | null;
  adjustmentPct: number;
}

export interface TierRow {
  minQty: number;
  maxQty: number | null;
  unitPrice: number;
}

export function generateTierTable(basePrice: number, rules: TierRule[]): TierRow[] {
  return [...rules]
    .sort((a, b) => a.minQty - b.minQty)
    .map((rule) => ({
      minQty: rule.minQty,
      maxQty: rule.maxQty,
      unitPrice: round2(basePrice * (1 + rule.adjustmentPct / 100)),
    }));
}

export function findTierPrice(rows: TierRow[], quantity: number): number | null {
  const match = rows.find(
    (row) => quantity >= row.minQty && (row.maxQty === null || quantity <= row.maxQty)
  );
  return match ? match.unitPrice : null;
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// --- Insumos y precio por unidad (calculadora-costos-e-insumos.md) --------
//
// Nota: no se duplican "calcCostoMaterial"/"calcCostoElectrico" del
// documento — son, matemáticamente, calcCostoMaterial(pesoGramos,
// costoPorKg) y calcCostoEnergia(...) de arriba (la fórmula de "Costo
// Rollo/Peso Rollo" del doc es la misma cuenta generalizada, con
// pesoRollo=1000g por default). Se reutilizan esas funciones ya testeadas.

export interface InsumoUsado {
  unitCost: number;
  quantity: number;
}

export function calcCostosExtras(insumos: InsumoUsado[]): number {
  return insumos.reduce((sum, i) => sum + i.unitCost * i.quantity, 0);
}

export function calcCostoTotal(costoMaterial: number, costoEnergia: number, costosExtras: number): number {
  return costoMaterial + costoEnergia + costosExtras;
}

export function calcGananciaNeta(costoTotal: number, margenPct: number): number {
  return costoTotal * (margenPct / 100);
}

export function calcPrecioVenta(costoTotal: number, gananciaNeta: number): number {
  return costoTotal + gananciaNeta;
}

export function calcPrecioUnidad(precioVenta: number, cantidadPiezas: number): number {
  if (cantidadPiezas <= 0) throw new Error("La cantidad de piezas debe ser mayor a 0");
  return precioVenta / cantidadPiezas;
}
