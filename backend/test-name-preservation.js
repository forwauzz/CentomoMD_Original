import { NamePreservationEngine } from './src/services/formatter/NamePreservationEngine.ts';

// Test with the actual content from the user
const originalContent = `La fiche de réclamation du travailleur décrit l'événement suivant. Survenu le 7 octobre 2023, deux points. Ouvrir la parenthèse, guillemets. Je versais la chaudière d'eau. Ressenti de douleur côté gauche, bas du dos. Ensuite, j'ai poussé le chariot direction l'ascenseur. La roue devant du chariot reste prise dans la craque de l'ascenseur. Ressenti, point. Pression côté gauche au moment et quand j'ai retiré le chariot, sensation de chaud dans le bas du dos. J'ai été avertir le superviseur que j'avais de douleur. J'ai pris pilule, Advil. J'ai continué de travailler et plus les heures passaient, plus la pression côté gauche respirait. Ça me faisait mal quand j'ai respiré. Le lendemain, j'ai rentré, mais j'ai pas effectué le travail. J'ai supervisé une autre employée pour qu'elle le fasse pour moi debout ou assis. C'était difficile la journée pour moi. Fermez guillemets, fermez la parenthèse. La travailleuse consulte le docteur Harry Durusso, 9 octobre 2023. Il diagnostique un entorse lombaire. Il prescrit un arrêt de travail, des antidouleurs et des traitements en physiothérapie. La travailleuse revoit le docteur Harry Durusso, 6 novembre 2023. Il maintient le diagnostic d'entorse lombaire, l'arrêt de travail et les traitements en physiothérapie. La travailleuse revoit le docteur Harry Durusso, 19 décembre 2023. Il juge la condition clinique stable. Il maintient les traitements en physiothérapie et l'arrêt de travail. La travailleuse revoit le docteur Harry Durusso, 30 janvier 2024. Il maintient les traitements en physiothérapie et l'arrêt de travail. La travailleuse revoit le docteur Harry Durusso, 12 mars 2024. Il juge la condition clinique stable. Il maintient les traitements en physiothérapie et l'arrêt de travail. La travailleuse obtient une résonance magnétique de la colonne lombaire, le 23 mars 2024. Elle est interprétée par le docteur Roxanne Bouchard-Bellavance, radiologiste. Cette dernière constate. Ouvrez la parenthèse. Guillemets. Trois petits points. Conclusion, deux points. Changement dégénératif, tel qu'il est caractérisé, avec discopathie prédominant en L5 S1. Sténose biforaminale, modérée à sévère à gauche et minime à droite. Pas de sténose punale centrale significative. À la ligne légère déformation cuniforme de T12, d'allure non récente, à corrélé à l'historique traumatique. Point. À la ligne nodularité surrénalienne gauche et formation d'apparence cystique rénale droite. Partiellement incluse, virgule. Probablement bénigne, virgule. Mais pour lequel une tomodensitométrie avec protocole dédié et par prudence recommandée, étant donné leur inclusion partielle et l'absence d'études comparatives. Point. Fermez les guillemets. Fermez la parenthèse. Travailleuse revoit le docteur Durousseau le 16 avril 2024. Il maintient le diagnostic d'entosse lombaire et juge la condition clinique stable. Il prescrit des traitements en physiothérapie, virgule ergothérapie, et demande un développement des capacités fonctionnelles et maintient l'arrêt de travail. Il prescrit des infiltrations au niveau du rachis lombaire.`;

const formattedContent = `7. Historique de faits et évolution

La fiche de réclamation du travailleur décrit l'événement suivant, survenu le 7 octobre 2023 : « Je versais la chaudière d'eau. Ressenti de douleur côté gauche, bas du dos. Ensuite, j'ai poussé le chariot direction l'ascenseur. La roue devant du chariot reste prise dans la craque de l'ascenseur. Ressenti. Pression côté gauche au moment et quand j'ai retiré le chariot, sensation de chaud dans le bas du dos. J'ai été avertir le superviseur que j'avais de douleur. J'ai pris pilule, Advil. J'ai continué de travailler et plus les heures passaient, plus la pression côté gauche respirait. Ça me faisait mal quand j'ai respiré. Le lendemain, j'ai rentré, mais j'ai pas effectué le travail. J'ai supervisé une autre employée pour qu'elle le fasse pour moi debout ou assis. C'était difficile la journée pour moi. »

La travailleuse consulte le docteur Harry, le 9 octobre 2023. Il diagnostique une entorse lombaire. Il prescrit un arrêt de travail, des antidouleurs et des traitements en physiothérapie. 

La travailleuse revoit le docteur Harry, le 6 novembre 2023. Il maintient le diagnostic d'entorse lombaire, l'arrêt de travail et les traitements en physiothérapie. 

La travailleuse revoit le docteur Harry, le 19 décembre 2023. Il juge la condition clinique stable. Il maintient les traitements en physiothérapie et l'arrêt de travail. 

La travailleuse revoit le docteur Harry, le 30 janvier 2024. Il maintient les traitements en physiothérapie et l'arrêt de travail. 

La travailleuse revoit le docteur Harry, le 12 mars 2024. Il juge la condition clinique stable. Il maintient les traitements en physiothérapie et l'arrêt de travail. 

La travailleuse obtient une résonance magnétique de la colonne lombaire, le 23 mars 2024. Elle est interprétée par le docteur Roxanne, radiologiste. Cette dernière constate : « ... Conclusion : Changement dégénératif, tel qu'il est caractérisé, avec discopathie prédominant en L5-S1. Sténose biforaminale, modérée à sévère à gauche et minime à droite. Pas de sténose punale centrale significative. Légère déformation cuniforme de T12, d'allure non récente, à corrélé à l'historique traumatique. Nodularité surrénalienne gauche et formation d'apparence cystique rénale droite. Partiellement incluse, probablement bénigne, mais pour lequel une tomodensitométrie avec protocole dédié et par prudence recommandée, étant donné leur inclusion partielle et l'absence d'études comparatives. »

La travailleuse revoit le docteur Durousseau, le 16 avril 2024. Il maintient le diagnostic d'entorse lombaire et juge la condition clinique stable. Il prescrit des traitements en physiothérapie, ergothérapie, et demande un développement des capacités fonctionnelles tout en maintenant l'arrêt de travail. Il prescrit des infiltrations au niveau du rachis lombaire.`;

console.log('=== TESTING NAME PRESERVATION ENGINE ===\n');

// Test 1: Extract names from original content
console.log('1. EXTRACTING NAMES FROM ORIGINAL CONTENT:');
const originalNames = NamePreservationEngine.extractDoctorNames(originalContent, 'fr');
console.log('Original names found:', originalNames);
console.log('');

// Test 2: Extract names from formatted content
console.log('2. EXTRACTING NAMES FROM FORMATTED CONTENT:');
const formattedNames = NamePreservationEngine.extractDoctorNames(formattedContent, 'fr');
console.log('Formatted names found:', formattedNames);
console.log('');

// Test 3: Validate name preservation
console.log('3. VALIDATING NAME PRESERVATION:');
const validation = NamePreservationEngine.validateNamePreservation(originalContent, formattedContent, 'fr');
console.log('Validation result:', validation);
console.log('');

// Test 4: Restore truncated names
console.log('4. RESTORING TRUNCATED NAMES:');
const restoration = NamePreservationEngine.restoreTruncatedNames(originalContent, formattedContent, 'fr');
console.log('Restoration result:', restoration);
console.log('');

// Test 5: Show the restored content
console.log('5. RESTORED CONTENT:');
console.log(restoration.restoredContent);
