export const transcriptionService = {
  startTranscription: async () => {
    console.log("Transcription started (simulated)");
  },
  stopTranscription: async () => {
    console.log("Transcription stopped (simulated)");
  },
  getStatus: () => {
    return { running: false }; // Optional: wire up to actual state later
  }
};
