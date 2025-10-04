export const FFLAGS = {
  AUDIO_48K_MONO_WORKLET:
    (import.meta.env.VITE_AUDIO_48K_MONO_WORKLET ?? 'true') !== 'false',
  AUDIO_FORCE_RESAMPLER_48K:
    (import.meta.env.VITE_AUDIO_FORCE_RESAMPLER_48K ?? 'false') === 'true',
  WS_DEBUG_BINARY_LOG:
    (import.meta.env.VITE_WS_DEBUG_BINARY_LOG ?? 'false') === 'true',
};
