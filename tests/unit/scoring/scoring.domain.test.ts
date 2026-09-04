import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { calculatePredictionPoints, normalizeOneXTwoOdds } from "@/modules/predictions/scoring.domain";

describe("calculatePredictionPoints", () => {
  it("applies the lower bound for very high probability", () => {
    expect(calculatePredictionPoints("1")).toBe(7);
    expect(calculatePredictionPoints("0.99")).toBe(7);
  });

  it("applies the upper bound for low probability", () => {
    expect(calculatePredictionPoints("0.01")).toBe(50);
    expect(calculatePredictionPoints("0.13")).toBe(50);
  });

  it("calculates normal mid-range probabilities", () => {
    expect(calculatePredictionPoints("0.75")).toBe(9);
    expect(calculatePredictionPoints("0.65")).toBe(10);
    expect(calculatePredictionPoints("0.55")).toBe(12);
    expect(calculatePredictionPoints("0.45")).toBe(14);
    expect(calculatePredictionPoints("0.35")).toBe(19);
    expect(calculatePredictionPoints("0.30")).toBe(22);
    expect(calculatePredictionPoints("0.25")).toBe(26);
    expect(calculatePredictionPoints("0.20")).toBe(33);
    expect(calculatePredictionPoints("0.15")).toBe(43);
  });

  it("uses deterministic half-up Decimal rounding", () => {
    expect(calculatePredictionPoints(new Prisma.Decimal(6.5).div(10.49))).toBe(10);
    expect(calculatePredictionPoints(new Prisma.Decimal(6.5).div(10.5))).toBe(11);
  });

  it("rejects invalid probability", () => {
    expect(() => calculatePredictionPoints("0")).toThrow(/greater than zero/);
    expect(() => calculatePredictionPoints("-0.1")).toThrow(/greater than zero/);
    expect(() => calculatePredictionPoints("1.00000001")).toThrow(/less than or equal to 1/);
    expect(() => calculatePredictionPoints(Number.NaN)).toThrow(/valid decimal|finite/);
  });
});

describe("normalizeOneXTwoOdds", () => {
  it("normalizes implied 1X2 probabilities after removing overround", () => {
    const probabilities = normalizeOneXTwoOdds({
      home: "2.00",
      draw: "3.50",
      away: "4.00",
    });
    const total = probabilities.home.plus(probabilities.draw).plus(probabilities.away);

    expect(total.toNumber()).toBeCloseTo(1, 12);
    expect(probabilities.home.toNumber()).toBeCloseTo(0.4827586206896552, 12);
    expect(probabilities.draw.toNumber()).toBeCloseTo(0.27586206896551724, 12);
    expect(probabilities.away.toNumber()).toBeCloseTo(0.2413793103448276, 12);
  });

  it("rejects zero or negative odds", () => {
    expect(() => normalizeOneXTwoOdds({ home: "0", draw: "3.5", away: "4" })).toThrow(
      /greater than zero/,
    );
    expect(() => normalizeOneXTwoOdds({ home: "2", draw: "-3.5", away: "4" })).toThrow(
      /greater than zero/,
    );
  });
});
