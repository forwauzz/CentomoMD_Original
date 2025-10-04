/**
 * Audio processing utilities for transcription service
 * Handles PCM conversion, frame sizing, and logging
 */

/**
 * Calculate samples per 20ms frame for a given sample rate
 * @param sampleRate - Sample rate in Hz
 * @returns Number of samples per 20ms frame
 */
export function samplesPer20ms(sampleRate: number): number {
  return Math.floor(sampleRate * 0.02);
}

/**
 * Convert stereo audio to mono by averaging left and right channels
 * @param stereoData - Float32Array with stereo audio data (interleaved L-R-L-R...)
 * @returns Float32Array with mono audio data
 */
export function stereoToMono(stereoData: Float32Array): Float32Array {
  const monoData = new Float32Array(stereoData.length / 2);
  for (let i = 0; i < monoData.length; i++) {
    const left = stereoData[i * 2] ?? 0;
    const right = stereoData[i * 2 + 1] ?? 0;
    monoData[i] = (left + right) / 2;
  }
  return monoData;
}

/**
 * Convert Float32 audio data to PCM16LE format
 * @param float32Data - Float32Array with audio data (range -1.0 to 1.0)
 * @returns Uint8Array with PCM16LE data
 */
export function float32ToPCM16LE(float32Data: Float32Array): Uint8Array {
  const pcm16Data = new Int16Array(float32Data.length);
  const pcm8Data = new Uint8Array(pcm16Data.length * 2);
  
  for (let i = 0; i < float32Data.length; i++) {
    // Clamp to [-1, 1] and convert to 16-bit integer
    const sample = Math.max(-1, Math.min(1, float32Data[i] ?? 0));
    pcm16Data[i] = Math.round(sample * 32767);
  }
  
  // Convert to little-endian byte array
  for (let i = 0; i < pcm16Data.length; i++) {
    const sample = pcm16Data[i] ?? 0;
    pcm8Data[i * 2] = sample & 0xFF;         // Low byte
    pcm8Data[i * 2 + 1] = (sample >> 8) & 0xFF; // High byte
  }
  
  return pcm8Data;
}

/**
 * Calculate RMS (Root Mean Square) of PCM16 audio data
 * @param pcmData - PCM16 audio data
 * @returns RMS value
 */
function calculateRMS(pcmData: Uint8Array): number {
  if (pcmData.length === 0) return 0;
  
  let sum = 0;
  for (let i = 0; i < pcmData.length; i += 2) {
    // Convert little-endian bytes to 16-bit sample
    const lowByte = pcmData[i] ?? 0;
    const highByte = pcmData[i + 1] ?? 0;
    const sample = lowByte | (highByte << 8);
    // Convert to signed 16-bit
    const signedSample = sample > 32767 ? sample - 65536 : sample;
    sum += signedSample * signedSample;
  }
  
  return Math.sqrt(sum / (pcmData.length / 2));
}

/**
 * Log PCM16 audio statistics for debugging
 * @param label - Label for the log entry (e.g., 'tx', 'rx')
 * @param pcmBytes - PCM16 audio data
 * @param sampleRate - Sample rate in Hz (optional, defaults to 16000)
 */
export function logPcm16Stats(label: string, pcmBytes: Uint8Array, sampleRate: number = 16000): void {
  if (!pcmBytes || pcmBytes.length === 0) {
    console.log(`[AUDIO] ${label}: empty buffer`);
    return;
  }
  
  const rms = calculateRMS(pcmBytes);
  const samples = pcmBytes.length / 2; // 2 bytes per 16-bit sample
  const durationMs = (samples / sampleRate) * 1000;
  const expectedBytesPer20ms = samplesPer20ms(sampleRate) * 2;
  
  console.log(`[AUDIO] ${label}: ${pcmBytes.length}B, ${samples} samples, ${durationMs.toFixed(1)}ms, RMS=${rms.toFixed(1)}, expected/20ms=${expectedBytesPer20ms}B`);
}

/**
 * Sleep utility for async operations
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
