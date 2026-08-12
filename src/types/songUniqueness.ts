export interface SongUniquenessVector {
  stereoWidth: number;
  brightness: number;
  silenceRatio: number;
  density: number;
  harmonicStability: number;
  repetitionScore: number;
  focalStability: number;
  organic: number;
  /** Stable hash for differentiating similar-energy songs */
  differentiationKey: string;
}
