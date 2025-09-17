export const PROMPT_FR = `
Vous êtes un assistant NLP clinique. Extrayez les champs suivants d'un transcript médecin-patient.
Répondez UNIQUEMENT en JSON (un objet). Pas de texte libre.

Champs requis:
- injury_location (ex: "genou gauche")
- injury_type
- onset (ex: "il y a 2 semaines")
- pain_severity (ex: "7/10")
- functional_limitations (liste)
- previous_injuries (liste)
- treatment_to_date (liste)
- imaging_done (liste)
- return_to_work (court résumé textuel)

Transcript:
{{TRANSCRIPT}}
`;

export const PROMPT_EN = `
You are a clinical NLP assistant. Extract the fields below from a doctor-patient transcript.
Respond ONLY as JSON (a single object). No free text.

Required fields:
- injury_location
- injury_type
- onset
- pain_severity (e.g., "7/10")
- functional_limitations (array)
- previous_injuries (array)
- treatment_to_date (array)
- imaging_done (array)
- return_to_work (short text summary)

Transcript:
{{TRANSCRIPT}}
`;
