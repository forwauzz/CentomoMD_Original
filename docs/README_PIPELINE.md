# Pipeline R&D — Section 7 (CNESST – Historique de faits et évolution)

## 🎯 Objectif

Ce pipeline de recherche et développement (R&D) est un environnement sandbox isolé pour tester et évaluer les améliorations du formateur de la Section 7 (CNESST – Historique de faits et évolution) sans affecter les templates de production existants.

## 🧱 Structure d'isolation

**⚠️ IMPORTANT :** Ce pipeline est complètement isolé de la production. Aucun fichier de production n'est modifié ou remplacé.

### Dossiers créés :
- `/configs/` — Configuration du pipeline
- `/prompts/` — Prompts et plans d'exécution
- `/system/` — Conductor système
- `/training/` — Standards de référence (Golden Standard)
- `/docs/` — Documentation du pipeline

## 🧩 Artefacts du pipeline

### 1. Configuration maître
- **Fichier :** `/configs/master_prompt_section7.json`
- **Rôle :** Point d'entrée du pipeline, référence tous les autres artefacts
- **Langue :** Français (Québec)

### 2. Conductor système
- **Fichier :** `/system/system_section7_fr-ca.md`
- **Rôle :** Prompt de niveau système qui orchestre le processus de formatage
- **Langue :** Français (Québec)

### 3. Plan d'exécution
- **Fichier :** `/prompts/plan_section7_fr.xml`
- **Rôle :** Plan détaillé de formatage de la Section 7
- **Langue :** Français (Québec)

### 4. Évaluation gestionnaire
- **Fichier :** `/prompts/manager_eval_section7_fr.xml`
- **Rôle :** Critères d'évaluation pour valider la qualité du formatage
- **Langue :** Français (Québec)

### 5. Standards de référence
- **Fichier :** `/training/golden_cases_section7.jsonl`
- **Rôle :** Cas d'usage exemplaires pour l'entraînement et l'évaluation
- **Langue :** Français (Québec)

## 🔄 Ordre d'exécution du pipeline

1. **Configuration maître** → Charge la configuration du pipeline
2. **Conductor système** → Initialise le contexte et les règles
3. **Plan d'exécution** → Exécute le formatage selon le plan
4. **Évaluation gestionnaire** → Valide la qualité du résultat
5. **Standards de référence** → Compare avec les cas exemplaires

## 🚀 Utilisation

Ce pipeline peut être utilisé pour :
- Tester de nouvelles approches de formatage
- Évaluer la performance sur des cas spécifiques
- Développer des améliorations avant déploiement
- Créer des pipelines similaires pour d'autres sections (Section 8, 9, etc.)

## 🔒 Sécurité

- **Isolation complète** : Aucun impact sur la production
- **Validation humaine requise** : Ne pas fusionner dans main sans validation
- **Langue française** : Tous les artefacts sont en français (Québec)
- **Conformité** : Respect des standards CNESST et des réglementations québécoises

## 📋 Prochaines étapes

Une fois ce pipeline validé, il peut servir de modèle pour créer des pipelines similaires pour d'autres sections du formulaire CNESST.
