/**
 * Statistical Analysis Library
 * Implements Wilcoxon signed-rank test and bootstrap confidence intervals
 */

/**
 * Wilcoxon Signed-Rank Test
 * Tests if paired differences have a symmetric distribution around zero
 * 
 * @param pairedDifferences Array of paired differences (current - reference)
 * @returns p-value and test statistic
 */
export function wilcoxonSignedRankTest(pairedDifferences: number[]): {
  statistic: number;
  pValue: number;
  significant: boolean;
} {
  if (pairedDifferences.length < 3) {
    // Not enough data for meaningful test
    return {
      statistic: 0,
      pValue: 1.0,
      significant: false,
    };
  }

  // Step 1: Calculate absolute differences and ranks
  const absDiffs = pairedDifferences.map(Math.abs);
  const signs = pairedDifferences.map(d => Math.sign(d));

  // Sort by absolute difference and assign ranks
  const indexed = absDiffs.map((abs, i) => ({ abs, sign: signs[i], index: i }));
  indexed.sort((a, b) => a.abs - b.abs);

  // Assign ranks (handle ties with average rank)
  const ranks: number[] = new Array(pairedDifferences.length).fill(0);
  let currentRank = 1;
  let i = 0;

  while (i < indexed.length) {
    const currentItem = indexed[i];
    if (!currentItem) break; // Safety check
    const currentAbs = currentItem.abs;
    const tieGroup: number[] = [i];

    // Find all ties
    let j = i + 1;
    while (j < indexed.length) {
      const nextItem = indexed[j];
      if (!nextItem || nextItem.abs !== currentAbs) break;
      tieGroup.push(j);
      j++;
    }

    // Calculate average rank for tie group
    const averageRank = tieGroup.reduce((sum, idx) => sum + currentRank + idx - i, 0) / tieGroup.length;

    // Assign ranks
    for (const idx of tieGroup) {
      const item = indexed[idx];
      if (item && item.sign !== undefined) {
        ranks[item.index] = averageRank * item.sign;
      }
    }

    currentRank += tieGroup.length;
    i = j;
  }

  // Step 2: Calculate W statistic (sum of positive ranks)
  const W = ranks.filter(r => r > 0).reduce((sum, r) => sum + r, 0);
  const n = ranks.filter(r => r !== 0).length; // Exclude zero differences

  if (n < 3) {
    return {
      statistic: W,
      pValue: 1.0,
      significant: false,
    };
  }

  // Step 3: Calculate p-value using normal approximation
  // Expected value of W under null hypothesis
  const EW = (n * (n + 1)) / 4;
  
  // Variance of W
  const ties = countTies(absDiffs);
  const tieCorrection = Object.values(ties).reduce((sum, count) => {
    const t = count;
    return sum + (t * t * t - t) / 48;
  }, 0);
  const VarW = (n * (n + 1) * (2 * n + 1)) / 24 - tieCorrection;

  // Standard deviation
  const stdDev = Math.sqrt(VarW);

  // Z-score
  const z = (W - EW) / stdDev;

  // Two-tailed p-value from normal distribution
  // Using approximation: p = 2 * (1 - Φ(|z|))
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));

  return {
    statistic: W,
    pValue: Math.max(0, Math.min(1, pValue)), // Clamp to [0, 1]
    significant: pValue < 0.05,
  };
}

/**
 * Bootstrap Confidence Interval
 * Resamples data to estimate confidence interval
 * 
 * @param data Array of paired differences
 * @param confidenceLevel Confidence level (default 0.95)
 * @param bootstrapSamples Number of bootstrap samples (default 1000)
 * @returns Confidence interval [lower, upper]
 */
export function bootstrapConfidenceInterval(
  data: number[],
  confidenceLevel: number = 0.95,
  bootstrapSamples: number = 1000
): {
  ciLow: number;
  ciHigh: number;
  mean: number;
} {
  if (data.length === 0) {
    return { ciLow: 0, ciHigh: 0, mean: 0 };
  }

  const alpha = 1 - confidenceLevel;
  const lowerPercentile = (alpha / 2) * 100;
  const upperPercentile = (1 - alpha / 2) * 100;

  // Bootstrap: resample with replacement
  const bootstrapMeans: number[] = [];

  for (let i = 0; i < bootstrapSamples; i++) {
    const resampled = resample(data);
    const mean = resampled.reduce((sum, val) => sum + val, 0) / resampled.length;
    bootstrapMeans.push(mean);
  }

  // Sort and get percentiles
  bootstrapMeans.sort((a, b) => a - b);

  const ciLow = percentile(bootstrapMeans, lowerPercentile);
  const ciHigh = percentile(bootstrapMeans, upperPercentile);
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;

  return {
    ciLow,
    ciHigh,
    mean,
  };
}

/**
 * Effect Size (Cohen's d)
 * Measures the standardized difference between means
 */
export function cohensD(current: number[], reference: number[]): number {
  if (current.length === 0 || reference.length === 0) {
    return 0;
  }

  const meanCurrent = current.reduce((sum, val) => sum + val, 0) / current.length;
  const meanReference = reference.reduce((sum, val) => sum + val, 0) / reference.length;

  const varCurrent = variance(current);
  const varReference = variance(reference);

  const pooledStdDev = Math.sqrt((varCurrent + varReference) / 2);

  if (pooledStdDev === 0) {
    return 0;
  }

  return (meanCurrent - meanReference) / pooledStdDev;
}

// Helper functions

function countTies(values: number[]): Record<number, number> {
  const ties: Record<number, number> = {};
  for (const val of values) {
    ties[val] = (ties[val] || 0) + 1;
  }
  return ties;
}

function normalCDF(x: number): number {
  // Approximation of standard normal CDF
  // Using Abramowitz and Stegun approximation
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x) / Math.sqrt(2.0);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

function resample<T>(data: T[]): T[] {
  const resampled: T[] = [];
  if (data.length === 0) return resampled;
  for (let i = 0; i < data.length; i++) {
    const randomIndex = Math.floor(Math.random() * data.length);
    const item = data[randomIndex];
    if (item !== undefined) {
      resampled.push(item);
    }
  }
  return resampled;
}

function percentile(sortedData: number[], percentile: number): number {
  if (sortedData.length === 0) return 0;
  
  const index = (percentile / 100) * (sortedData.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) {
    const value = sortedData[lower];
    return value !== undefined ? value : 0;
  }

  const lowerValue = sortedData[lower];
  const upperValue = sortedData[upper];
  if (lowerValue === undefined || upperValue === undefined) return 0;
  
  const weight = index - lower;
  return lowerValue * (1 - weight) + upperValue * weight;
}

function variance(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => (val - mean) ** 2);
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
}

