import { describe, expect, it } from "vitest";
import {
  calcCostoBreakdown,
  calcPrecioSugerido,
  findTierPrice,
  generateTierTable,
} from "./pricing";

describe("calcCostoBreakdown", () => {
  it("calcula material, energía y mano de obra con la fórmula del spec", () => {
    // 50g de PLA a $25.000/kg, 3hs de impresión, impresora de 200W,
    // tarifa UTE $8/kWh, 0.5hs de diseño a $500/h.
    const result = calcCostoBreakdown({
      pesoGramos: 50,
      costoPorKg: 25000,
      tiempoHoras: 3,
      consumoWatts: 200,
      tarifaUteKwh: 8,
      tiempoDisenoHoras: 0.5,
      valorHora: 500,
    });

    expect(result.costoMaterial).toBeCloseTo((50 / 1000) * 25000, 6); // 1250
    expect(result.costoEnergia).toBeCloseTo((200 / 1000) * 3 * 8, 6); // 4.8
    expect(result.costoManoObra).toBeCloseTo(0.5 * 500, 6); // 250
    expect(result.costoTotal).toBeCloseTo(1250 + 4.8 + 250, 6);
  });

  it("no requiere mano de obra si no se especifica", () => {
    const result = calcCostoBreakdown({
      pesoGramos: 100,
      costoPorKg: 1000,
      tiempoHoras: 1,
      consumoWatts: 100,
      tarifaUteKwh: 10,
    });
    expect(result.costoManoObra).toBe(0);
  });
});

describe("calcPrecioSugerido", () => {
  it("aplica el margen sobre el costo total", () => {
    expect(calcPrecioSugerido(1000, 40)).toBeCloseTo(1400, 6);
    expect(calcPrecioSugerido(1000, 0)).toBeCloseTo(1000, 6);
  });
});

describe("generateTierTable / findTierPrice", () => {
  const rules = [
    { minQty: 1, maxQty: 9, adjustmentPct: 20 },
    { minQty: 10, maxQty: 19, adjustmentPct: 0 },
    { minQty: 20, maxQty: 49, adjustmentPct: -12 },
    { minQty: 50, maxQty: null, adjustmentPct: -20 },
  ];

  it("genera la tabla escalonada del ejemplo del spec (base $250)", () => {
    const table = generateTierTable(250, rules);
    expect(table).toEqual([
      { minQty: 1, maxQty: 9, unitPrice: 300 },
      { minQty: 10, maxQty: 19, unitPrice: 250 },
      { minQty: 20, maxQty: 49, unitPrice: 220 },
      { minQty: 50, maxQty: null, unitPrice: 200 },
    ]);
  });

  it("encuentra el precio correcto para una cantidad dada, incluido el tramo abierto", () => {
    const table = generateTierTable(250, rules);
    expect(findTierPrice(table, 5)).toBe(300);
    expect(findTierPrice(table, 15)).toBe(250);
    expect(findTierPrice(table, 30)).toBe(220);
    expect(findTierPrice(table, 500)).toBe(200);
  });
});
