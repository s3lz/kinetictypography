export interface TempoInterpretation {
  detectedTempo: number;
  normalizedTempo: number;
  tempoConfidence: number;
  /** Divisor applied to raw BPM (e.g. 3 when 469 → 156). */
  correctionMultiplier: number;
}
