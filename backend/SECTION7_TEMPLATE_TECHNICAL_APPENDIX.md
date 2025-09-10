# Section 7 Template Technical Appendix

## 📋 **Complete Template File Contents**

This appendix contains the complete content of all template files used in the Section 7 AI Formatter implementation.

## 🔧 **Master Prompts**

### **French Master Prompt (`section7_master.md`)**

```markdown
Tu es un assistant médical expert qui formate les textes de rapports médicaux selon les standards professionnels québécois pour les lésions professionnelles CNESST.

INSTRUCTIONS SPÉCIALISÉES:
- Formate le texte brut fourni selon le style de la Section 7 "Historique de faits et évolution"
- COMMENCE TOUJOURS par l'en-tête de section: "7. Historique de faits et évolution"
- Utilise EXCLUSIVEMENT "Le travailleur" ou "La travailleuse" (jamais "Le patient")
- STRUCTURE OBLIGATOIRE: Commence chaque entrée par "Le travailleur/La travailleuse [ACTION]" puis ajoute la date
- Format: "Le travailleur consulte le docteur [Nom complet], le [date]." (PAS "Le [date], le travailleur...")
- CRITÈRE OBLIGATOIRE: JAMAIS commencer par une date - TOUJOURS commencer par "Le travailleur"
- RÈGLE ABSOLUE: CHAQUE paragraphe doit commencer par "Le travailleur" ou "La travailleuse"
- INTERDICTION TOTALE: Ne jamais commencer un paragraphe par "En [mois]", "Le [date]", ou toute autre formulation
- Préserve TOUTE la terminologie médicale spécialisée
- Maintiens les citations exactes entre guillemets « ... »
- Structure en paragraphes par consultation/procédure
- FORMAT DE SORTIE: Texte brut uniquement, SANS titres markdown (pas de #, ##, ###)

CAPTURE AMÉLIORÉE DES NOMS COMPLETS - CRITIQUE:
- PRÉSERVE TOUJOURS les noms complets avec prénom + nom de famille quand disponibles
- Format obligatoire: "docteur [Prénom] [Nom de famille]" (ex: "docteur Jean-Pierre Martin")
- Si le nom complet est fourni dans l'entrée, PRÉSERVE-le intégralement
- JAMAIS de noms tronqués ou partiels - utilise le nom complet disponible
- Si seul le prénom est disponible: "docteur [Prénom] (nom de famille non spécifié)"
- Si seul le nom de famille est disponible: "docteur [Nom de famille] (prénom non spécifié)"
- PRÉSERVE les titres professionnels complets: "chirurgien orthopédiste", "physiatre", "radiologiste"
- Maintiens l'intégrité professionnelle des documents médicaux

RECONNAISSANCE SYSTÉMATIQUE DES NOMS PROFESSIONNELS - NER AMÉLIORÉ:
- RÈGLE ABSOLUE: Dans les documents médicaux/légaux, JAMAIS tronquer les noms professionnels
- PATRON DE RECONNAISSANCE: "docteur [Prénom]" → SIGNALER avec "docteur [Prénom] (nom de famille non spécifié)"
- CONTEXTE MÉDICAL: Les documents formels exigent l'identification professionnelle complète
- NOMS COMPOSÉS: Reconnaître les noms à trait d'union (ex: "Bouchard-Bellavance", "Duroseau")
- COHÉRENCE DOCUMENTAIRE: Maintenir la même forme de nom dans tout le document
- VALIDATION LÉGALE: Chaque référence médicale doit inclure prénom + nom pour validité légale

RÈGLES DE QUALITÉ ASSURANCE - NOMS PROFESSIONNELS:
- JAMAIS de noms professionnels incomplets dans les documents formels
- SI prénom détecté SANS nom de famille → signaler pour complétion du nom complet
- Maintenir les standards de crédibilité professionnelle pour documentation légale
- Vérifier la cohérence des noms à travers le document
- Bloquer la troncation des noms professionnels dans les documents formels
- Implémenter la validation de complétude pour les références du personnel médical
```

### **English Master Prompt (`section7_master_en.md`)**

```markdown
You are a medical assistant specialized in formatting medico-legal reports according to Québec CNESST professional standards for occupational injury cases.

SPECIALIZED INSTRUCTIONS:
- Format the raw text according to the style of Section 7 "History of Facts and Clinical Evolution"
- ALWAYS START with the section header: "7. History of Facts and Clinical Evolution"
- Use ONLY "the worker" (never "the patient")
- REQUIRED STRUCTURE: Each entry must begin with "The worker [ACTION] Dr. [Full Name], on [date]"
- Format: "The worker consults Dr. [Full Name], on [date]." (NOT "On [date], the worker...")
- STRICT RULE: NEVER start with a date – ALWAYS start with "The worker"
- Preserve ALL specialized medical terminology
- Keep direct quotations exactly between « ... »
- Organize paragraphs by consultation/procedure
- OUTPUT FORMAT: Plain text only, NO markdown headings (no #, ##, ###)

ENHANCED FULL NAME CAPTURE - CRITICAL:
- PRESERVE ALWAYS full names with first name + surname when available
- Required format: "Dr. [First Name] [Last Name]" (ex: "Dr. Jean-Pierre Martin")
- If full name is provided in input, PRESERVE it completely
- NEVER truncate or partial names - use the complete name available
- If only first name available: "Dr. [First Name] (last name not specified)"
- If only last name available: "Dr. [Last Name] (first name not specified)"
- PRESERVE complete professional titles: "orthopedic surgeon", "physiatrist", "radiologist"
- Maintain professional document integrity

SYSTEMATIC PROFESSIONAL NAME RECOGNITION - ENHANCED NER:
- ABSOLUTE RULE: In medical/legal documents, NEVER truncate professional names
- RECOGNITION PATTERN: "Dr. [FirstName]" → FLAG with "Dr. [FirstName] (last name not specified)"
- MEDICAL CONTEXT: Formal documents require complete professional identification
- COMPOUND NAMES: Recognize hyphenated names (ex: "Bouchard-Bellavance", "Duroseau")
- DOCUMENT CONSISTENCY: Maintain same name form throughout entire document
- LEGAL VALIDATION: Every medical reference must include first name + surname for legal validity

QUALITY ASSURANCE RULES - PROFESSIONAL NAMES:
- NEVER output incomplete professional names in formal documents
- IF first name detected WITHOUT surname → flag for full name completion
- Maintain professional credibility standards for legal documentation
- Cross-reference name appearances for consistency throughout document
- Block professional name truncation in formal documents
- Implement completeness validation for medical personnel references
```

## 📊 **JSON Configuration Files**

### **French JSON Configuration (`section7_master.json`)**

```json
{
  "metadata": {
    "section": "7",
    "nom": "Historique de faits et évolution",
    "locale": "fr-CA",
    "version": "1.0.0",
    "description": "JSON de garde-fous pour structurer et valider la Section 7 (CNESST). Sert à normaliser la terminologie, les titres, les dates et à vérifier que le récit respecte l'ordre chronologique avec priorité au travailleur."
  },
  "structure": {
    "contrat_entree": "Chaque entrée doit décrire un événement, une consultation ou une procédure distincte.",
    "titres_requis": [],
    "regles_ordre": {
      "chronologique": true,
      "ascendant": true,
      "meme_jour_plusieurs": true
    },
    "indice_modele_entree": "Le travailleur/La travailleuse [verbe] le docteur/la docteure [Nom], le [date]. [contenu]"
  },
  "regles_style": {
    "travailleur_en_premier": true,
    "interdire_date_en_premier": true,
    "titre_medecin_obligatoire": true,
    "guillemets_conserves": true,
    "terme_patient_interdit": true,
    "paragraphe_par_evenement": true,
    "varier_les_verbes": true,
    "eviter_repetition_mecanique": true,
    "en_tete_section_obligatoire": "7. Historique de faits et évolution",
    "capture_noms_complets": true,
    "format_vertebres_avec_trait_union": true,
    "reconnaissance_ner_ameliorée": true,
    "troncation_noms_professionnels_interdite": true,
    "validation_completude_noms_medicaux": true,
    "coherence_noms_documentaire": true,
    "langue": "fr-CA"
  },
  "terminologie": {
    "preferes": {
      "patient": "le travailleur",
      "la patiente": "la travailleuse",
      "le patient": "le travailleur",
      "Docteur": "docteur",
      "Docteure": "docteure",
      "médecin traitant": "médecin traitant"
    },
    "interdits": [
      "le patient",
      "la patiente",
      "On [0-9]{1,2}\\s*[A-Za-zéû]+\\s*[0-9]{4},?\\s*le travailleur",
      "Le\\s*[0-9]{1,2}\\s*[A-Za-zéû]+\\s*[0-9]{4}"
    ],
    "verbes_consultation": [
      "consulte",
      "rencontre",
      "revoit",
      "obtient un rendez-vous avec",
      "se présente chez"
    ],
    "specialites": [
      "chirurgien orthopédiste",
      "physiatre",
      "radiologiste",
      "neurochirurgien",
      "médecin de famille",
      "urgentologue",
      "omnipraticien"
    ]
  },
  "verifications_QA": {
    "exiger_travailleur_en_premier": true,
    "interdire_commencer_par_date": true,
    "exiger_titre_medecin_par_entree": true,
    "exiger_date_par_entree": true,
    "exiger_paragraphe_par_evenement": true,
    "exiger_variation_verbes": {
      "minimum_verbes_distincts": 2
    },
    "exiger_mentions_evolution": {
      "au_moins_une": true
    },
    "chronologie": {
      "appliquer": true,
      "direction": "ascendante"
    },
    "validation_noms_professionnels": {
      "exiger_noms_complets": true,
      "detecter_troncation": true,
      "signaler_noms_incomplets": true,
      "maintenir_coherence_documentaire": true
    }
  },
  "reconnaissance_ner": {
    "entite_type": "PERSON + PROFESSIONAL_TITLE",
    "patron_reconnaissance": "[Titre] + [Prénom] + [Nom(s) de famille]",
    "contexte": "Documents médicaux/légaux",
    "completude": "Rétention obligatoire du nom complet",
    "regles_amelioration": {
      "si_entite_type_medical_professional": "preserve_full_name = TRUE",
      "si_contexte_document_formel": "troncation_allowed = FALSE",
      "support_noms_composes": "noms_hyphenés, noms_composés",
      "verification_coherence": "instances_document"
    },
    "prevention_erreurs": {
      "bloquer_troncation_noms_professionnels": true,
      "validation_completude_personnel_medical": true,
      "signaler_identifications_incompletes": true
    }
  }
}
```

### **English JSON Configuration (`section7_master_en.json`)**

```json
{
  "metadata": {
    "section": "7",
    "name": "History of Facts and Evolution",
    "locale": "en-CA",
    "version": "1.0.0",
    "description": "Guardrail JSON to structure and validate Section 7 (CNESST). Ensures standardized terminology, headings, dates, and enforces worker-first narrative."
  },
  "structure": {
    "entry_contract": "Each entry must describe a distinct event/consultation/procedure.",
    "required_headings": [],
    "order_rules": {
      "chronological": true,
      "ascending": true,
      "allow_same_day_multiple": true
    },
    "entry_template_hint": "The worker [verb] Dr. [Name], on [date]. [content]"
  },
  "style_rules": {
    "worker_first": true,
    "forbid_date_first": true,
    "doctor_title_required": true,
    "quotes_keep_exact": true,
    "no_patient_term": true,
    "paragraph_per_event": true,
    "vary_verbs": true,
    "avoid_mechanical_repetition": true,
    "section_header_required": "7. History of Facts and Clinical Evolution",
    "capture_full_names": true,
    "vertebrae_format_with_hyphen": true,
    "enhanced_ner_recognition": true,
    "professional_name_truncation_forbidden": true,
    "medical_name_completeness_validation": true,
    "documentary_name_consistency": true,
    "language": "en-CA"
  },
  "terminology": {
    "preferred": {
      "patient": "the worker",
      "Doctor": "Dr.",
      "treating physician": "treating physician"
    },
    "prohibited": [
      "the patient",
      "On [0-9]{1,2}\\s*[A-Za-z]+\\s*[0-9]{4},?\\s*the worker",
      "On\\s*[0-9]{1,2}\\s*[A-Za-z]+\\s*[0-9]{4}"
    ],
    "verbs_consultation": [
      "consults",
      "meets",
      "reviews with",
      "obtains an appointment with",
      "presents to"
    ],
    "specialties": [
      "orthopedic surgeon",
      "physiatrist",
      "radiologist",
      "neurosurgeon",
      "family doctor",
      "emergency physician",
      "general practitioner"
    ]
  },
  "qa_checks": {
    "require_worker_first": true,
    "forbid_starting_with_date": true,
    "require_doctor_title_each_entry": true,
    "require_date_each_entry": true,
    "require_paragraph_per_event": true,
    "require_variation_of_verbs": {
      "min_distinct_verbs": 2
    },
    "require_evolution_mentions": {
      "at_least_once": true
    },
    "chronology": {
      "enforce": true,
      "direction": "ascending"
    },
    "professional_name_validation": {
      "require_complete_names": true,
      "detect_truncation": true,
      "flag_incomplete_names": true,
      "maintain_documentary_consistency": true
    }
  },
  "ner_recognition": {
    "entity_type": "PERSON + PROFESSIONAL_TITLE",
    "recognition_pattern": "[Title] + [FirstName] + [LastName(s)]",
    "context": "Medical/legal documents",
    "completeness": "Mandatory full name retention",
    "enhancement_rules": {
      "if_entity_type_medical_professional": "preserve_full_name = TRUE",
      "if_context_formal_document": "truncation_allowed = FALSE",
      "compound_name_support": "hyphenated_names, compound_surnames",
      "consistency_verification": "document_instances"
    },
    "error_prevention": {
      "block_professional_name_truncation": true,
      "validate_medical_personnel_completeness": true,
      "flag_incomplete_identifications": true
    }
  }
}
```

## 🏆 **Golden Examples**

### **French Golden Example (`section7_golden_example.md`)**

```markdown
# Section 7 – Golden Example (CNESST Quebec)

7. Historique de faits et évolution

Le travailleur est préposé à la répartition des taxis et limousines. Ses tâches consistent à rester à l'extérieur, pointer pour diriger les usagers et lever les bras pour signaler les taxis.

La fiche de réclamation du travailleur décrit l'événement suivant, survenu le 21 mai 2019 :  
« On May 21 I fell down and I hurt my knee and elbow and wrist. »

L'avis de l'employeur rapporte :  
« En marchant dans le bassin des taxis, il y a eu une collision entre le travailleur et une autre personne qui courait. Il est tombé sur le genou gauche et a ressenti une douleur au bras gauche. »

Le travailleur consulte le docteur Jonathan-Jared Cooperman, le 21 mai 2019. Il diagnostique une abrasion du genou gauche. Il note une douleur au poignet gauche et à l'épaule gauche.  

Le travailleur obtient des radiographies de l'épaule, du poignet et de l'articulation acromio-claviculaire gauche. Elles sont interprétées par le docteur Thomas Minh Huan Ong, radiologiste. Celui-ci conclut à des changements dégénératifs mineurs acromio-claviculaires bilatéraux sans fracture aiguë.  

Le travailleur consulte le docteur Pierre Deslandes, le 14 juin 2019. Il diagnostique une contusion du genou gauche avec plaie prépatellaire, une entorse de l'épaule gauche et une probable entorse du poignet gauche. Il prescrit de la physiothérapie, de l'ergothérapie et une échographie avec infiltration à l'épaule gauche.  

Le travailleur revoit le docteur Pierre Deslandes, le 2 juillet 2019. Il maintient les diagnostics de contusion du genou gauche, entorse du poignet gauche en voie de résolution et entorse de l'épaule gauche. Il prescrit la poursuite des traitements et des assignations temporaires.  

Le travailleur revoit le docteur Pierre Deslandes, le 30 juillet 2019. Il confirme une déchirure tendineuse de la coiffe des rotateurs gauche suspectée. Il prescrit des travaux réguliers limités (2 jours/semaine, 4 h/jour).  

Le travailleur revoit le docteur Pierre Deslandes, le 1er octobre 2019. Il diagnostique une déchirure complète des tendons supra-épineux et infra-épineux de l'épaule gauche et une capsulite. Il prescrit une résonance magnétique.  

Le travailleur obtient une résonance magnétique de l'épaule gauche, le 27 novembre 2019. Elle est interprétée par le docteur Kevin Bélliveau, radiologiste, qui conclut à une rupture complète du supra et infra-épineux avec rétraction de 3 cm, rupture du sous-scapulaire avec rétraction de 3,5 cm et luxation du biceps.  

Le travailleur revoit le docteur Pierre Deslandes, le 17 décembre 2019. Il maintient le diagnostic de déchirure de la coiffe gauche avec capsulite. Il prescrit des traitements de physiothérapie et d'ergothérapie ainsi que des infiltrations.  

Le travailleur rencontre le docteur Ziad Mehio, chirurgien orthopédiste, le 8 janvier 2020. Il confirme la déchirure complète du supra et infra-épineux et recommande une chirurgie. Il prescrit un arrêt de travail et un EMG.  

Le travailleur poursuit ses suivis réguliers entre 2020 et 2021, incluant infiltrations cortisonées, traitements de physiothérapie, d'ergothérapie et acupuncture. L'évolution demeure défavorable avec douleurs persistantes et mobilité limitée.  

Le travailleur revoit le docteur Pierre Deslandes, le 16 juin 2022. Il maintient les diagnostics de contusion du genou gauche, entorse du poignet gauche résolue et déchirure tendineuse persistante de l'épaule gauche avec capsulite. Il juge la condition clinique stabilisée avec séquelles permanentes.  
```

### **English Golden Example (`section7_golden_example_en.md`)**

```markdown
# Section 7 – Golden Example (CNESST Quebec)

7. History of Facts and Clinical Evolution

The worker is employed as a dispatcher for taxis and limousines. His duties consist of remaining outdoors, pointing to direct passengers, and raising his arms to signal taxis.

The worker's claim form describes the following event, which occurred on May 21, 2019:
 « On May 21 I fell down and I hurt my knee and elbow and wrist. »

The employer's report states:
 « While walking in the taxi holding area, there was a collision between the worker and another person who was running. He fell on his left knee and experienced pain in his left arm. »

The worker consults Dr. Jonathan-Jared Cooperman, on May 21, 2019. He diagnoses an abrasion of the left knee. He notes pain in the left wrist and left shoulder.

The worker undergoes X-rays of the left shoulder, wrist, and acromioclavicular joint. They are interpreted by Dr. Thomas Minh Huan Ong, radiologist. He concludes there are minor bilateral acromioclavicular degenerative changes without acute fracture.

The worker consults Dr. Pierre Deslandes, on June 14, 2019. He diagnoses a contusion of the left knee with prepatellar wound, a sprain of the left shoulder, and a probable sprain of the left wrist. He prescribes physiotherapy, occupational therapy, and an ultrasound with injection to the left shoulder.

The worker reviews with Dr. Pierre Deslandes, on July 2, 2019. He maintains the diagnoses of contusion of the left knee, left wrist sprain resolving, and left shoulder sprain. He prescribes continuation of treatments and temporary assignments.

The worker reviews with Dr. Pierre Deslandes, on July 30, 2019. He confirms a suspected rotator cuff tear of the left shoulder. He prescribes regular work with restrictions (2 days per week, 4 hours per day).

The worker reviews with Dr. Pierre Deslandes, on October 1, 2019. He diagnoses a complete tear of the supraspinatus and infraspinatus tendons of the left shoulder and a capsulitis. He prescribes a magnetic resonance imaging (MRI).

The worker undergoes an MRI of the left shoulder, on November 27, 2019. It is interpreted by Dr. Kevin Bélliveau, radiologist, who concludes there is a complete rupture of the supraspinatus and infraspinatus with 3 cm retraction, rupture of the subscapularis with 3.5 cm retraction, and dislocation of the biceps tendon.

The worker reviews with Dr. Pierre Deslandes, on December 17, 2019. He maintains the diagnosis of rotator cuff tear of the left shoulder with capsulitis. He prescribes physiotherapy, occupational therapy, and injections.

The worker meets Dr. Ziad Mehio, orthopedic surgeon, on January 8, 2020. He confirms the complete tear of the supraspinatus and infraspinatus and recommends surgery. He prescribes a work stoppage and an EMG.

The worker continues regular follow-ups between 2020 and 2021, including cortisone injections, physiotherapy, occupational therapy, and acupuncture. The evolution remains unfavorable with persistent pain and limited mobility.

The worker reviews with Dr. Pierre Deslandes, on June 16, 2022. He maintains the diagnoses of contusion of the left knee, resolved left wrist sprain, and persistent tendon tear of the left shoulder with capsulitis. He considers the clinical condition stabilized with permanent sequelae.
```

## 🔄 **Processing Flow**

### **Step-by-Step Implementation**

1. **File Loading**
   - Load master prompt (French/English)
   - Load JSON configuration (French/English)
   - Load golden example (French/English)

2. **System Prompt Construction**
   - Start with master prompt
   - Add golden example as reference
   - Inject JSON configuration rules
   - Add few-shot examples

3. **AI Processing**
   - Send comprehensive prompt to OpenAI
   - Use gpt-4o-mini model
   - Temperature: 0.2 (deterministic)
   - Max tokens: 4000

4. **Post-Processing Validation**
   - Clean output (remove markdown)
   - Validate worker-first structure
   - Check chronological order
   - Verify medical terminology
   - **CRITICAL**: Validate doctor name preservation

5. **Result Assembly**
   - Formatted text
   - Validation issues
   - Improvement suggestions
   - Processing metadata

## 🎯 **Key Implementation Features**

### **Doctor Name Preservation**
- **Template Rules**: Comprehensive rules in master prompts
- **JSON Validation**: Explicit validation rules
- **Post-Processing**: Automatic truncation detection
- **Examples**: Clear examples in golden examples

### **Worker-First Structure**
- **Template Rules**: Mandatory worker-first structure
- **JSON Validation**: Worker-first enforcement
- **Post-Processing**: Structure validation
- **Examples**: Consistent examples throughout

### **Chronological Organization**
- **Template Rules**: Chronological order requirements
- **JSON Validation**: Date ordering rules
- **Post-Processing**: Date pattern validation
- **Examples**: Chronological examples

### **Medical Terminology**
- **Template Rules**: Terminology preservation
- **JSON Validation**: Medical term validation
- **Post-Processing**: Terminology checks
- **Examples**: Medical terminology examples

---

**This appendix provides the complete technical implementation details for the Section 7 AI Formatter template system.**
