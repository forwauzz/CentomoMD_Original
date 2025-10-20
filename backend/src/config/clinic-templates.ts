// Clinic-specific text templates for Section C3 "Modalité de l'entrevue"

export interface ClinicTemplate {
  id: string;
  name: string;
  sectionC3Text: string;
}

export const CLINIC_TEMPLATES: Record<string, ClinicTemplate> = {
  'c761a142-0236-47c5-b894-2f9780ead241': {
    id: 'c761a142-0236-47c5-b894-2f9780ead241',
    name: 'la clinique du Complexe Médical Nord-de-Île (CMNDI)',
    sectionC3Text: `L'évaluation suivante s'est tenue dans les locaux de la clinique du Complexe Médical Nord-de-Île (CMNDI). Nous avons clairement expliqué à notre mandat d'évaluateur indépendant désigné par la CNESST dans le cadre de l'application de l'article 204 de la LATMP. Nous lui avons précisé que nous n'agirons pas en tant que médecins traitants. Notre rapport d'évaluation sera d'abord envoyé à la CNESST.

Nous avons procédé au questionnaire subjectif ainsi qu'à un examen physique détaillé en relation avec les lésions à évaluer, nous nous sommes assurés à la fin de l'entrevue d'avoir couvert l'ensemble de la problématique.

Nous avons revu le dossier CNESST de même que le dossier médical. Nous avons pu consulter l'ensemble des rapports et des bilans radiologiques réalisés dans le cadre de l'évaluation de la lésion.

L'entrevue s'est effectuée cordialement, la patiente participait pleinement à son entrevue. L'entrevue s'est déroulée entre.

À la fin de l'entrevue, nous avons demandé à si elle avait d'autres commentaires ou informations à nous divulguer. Cette dernière nous a répondu par la négative.`
  },
  'f3af2ced-9008-412a-b736-de1926bd6458': {
    id: 'f3af2ced-9008-412a-b736-de1926bd6458',
    name: 'la Clinique Médicale de l\'Or et des Bois, Val-d\'Or',
    sectionC3Text: `L'évaluation suivante s'est tenue dans les locaux de la Clinique Médicale de l'Or et des Bois, Val-d'Or. Nous avons clairement expliqué à notre mandat d'évaluateur indépendant désigné par la CNESST dans le cadre de l'application de l'article 204 de la LATMP. Nous lui avons précisé que nous n'agirons pas en tant que médecins traitants. Notre rapport d'évaluation sera d'abord envoyé à la CNESST.

Nous avons procédé au questionnaire subjectif ainsi qu'à un examen physique détaillé en relation avec les lésions à évaluer, nous nous sommes assurés à la fin de l'entrevue d'avoir couvert l'ensemble de la problématique.

Nous avons revu le dossier CNESST de même que le dossier médical. Nous avons pu consulter l'ensemble des rapports et des bilans radiologiques réalisés dans le cadre de l'évaluation de la lésion.

L'entrevue s'est effectuée cordialement, le travailleur participait pleinement à son entrevue. L'entrevue s'est déroulée entre.

À la fin de l'entrevue, nous avons demandé à s'il avait d'autres commentaires ou informations à nous divulguer. Ce dernier nous a répondu par la négative.`
  }
};

// Helper function to get clinic template by ID
export const getClinicTemplate = (clinicId: string): ClinicTemplate | null => {
  return CLINIC_TEMPLATES[clinicId] || null;
};

// Helper function to get all clinic templates
export const getAllClinicTemplates = (): ClinicTemplate[] => {
  return Object.values(CLINIC_TEMPLATES);
};
