// Load environment variables first
import 'dotenv/config';

import { section7RdService } from './dist/src/services/section7RdService.js';

console.log('🧪 Section 7 R&D Pipeline - Full Real-World Test');
console.log('=' .repeat(60));

// Real-world transcript with patient verbatim and radiologist reports
const realWorldInput = `la fiche de réclamation du travailleur décrit l'événement suivant survenu le 19 avril 2024 - mon aide virgule nous étions en train de décharger un lit d'hôpital de 300 400 livres de la boîte de camion sur une terre gate j'ai vu le lit glisser vers moi il y avait euh eu de béton en arrière de moi j'ai eu peur de me faire coincer entre le mur et le lit j'ai sauté en bas de la terre de 4 pieds de haut et je me suis fait mal au dos ça va à la rencontre de docteur Sonia le 19 avril 2024 elle diagnostique un trauma dorsaux lombaire et pour droite elle ne prescrit des radiographies un scan Longo sacré et prescrit un arrêt de travail le travaille encore en compte le docteur Leclerc le 3 juin 2024 le diagnostics de construction dorceaux lombaire et épaule droite il le maintient dans le travail et prescrit de la physiothérapie je travaille à la rencontre le docteur Leclerc le 4 juillet 2024 il le diagnostic est une conclusion dorsaux lombaire il maintient les traitements en physiothérapie et l'arrêt de travail le travailleur Leclerc le 1er août 2024 et le diagnostic qu'il contient lombaire et un syndrome douloureux résiduel il prescrit de la physiothérapie au besoin et un retour au travail progressif avec tâches déjà Leclerc le 3 septembre 2024 et juge la condition clinique stable et note que le travail est attaque à conduire le camion mais ne peut manipuler de charge point incroyable incroyable 28 octobre 2024 il note un syndrome douloureux et le prescrit des blocs à cet air L4 L5 et L55 bilatérale et clinique stable.ca voilà radiographie de la colonne Lambert le 6 août 2024 elle était interprétée par le docteur Claudine Deshaies radiologiste cette dernière constate évidemment ostéopathique entérolatéral est âgé est connu virgule plus marqué en l2l3 point pencement dégénératifs modéré en L55 cette trouvaille m'apparaissent à échanger par rapport à des films récents d'avril 2024 là tu es légèrement qualifié il y a un peu plus d'arthrose à cet arbre alors ok le radiographie de l'épaule droite le 19 avril 2024 elle était interprétée par le docteur Marie-Josée berthiaule radiologiste et pour le droite microscalification à l'en-tête de l'impact pneus versus le petit rond au niveau de la tête libérale postérieure sur l'incidence latérale ceci allumé métrique je ne perçois pas de changement cellulaire et qui est hétérogénéité de la grosse liberté sur fond probablement de tantinopathie chroniques libéral est préservée pas d'attraction objectivé la communauté un petit peu dégénérative sans plus il y a un petit éperon sous la première et l'établi le tout suggérable un certain accrochage et ou une toxopathie quoi 19 avril 2019 le travailleur revoit le docteur Leclerc virgule le 8 janvier 2025 il maintient le diagnostic de syndrome douloureux chroniques lombaire post-traumatique point et le juge la condition clinique détériorée en psychologie et prescrit des blocs facettaire il maintient le travail de chauffeur avec des manipulations de charge légère le docteur Leclerc produit une information médicale complémentaire écrite le 6 mars 2025 et note persistance de syndrome douloureux lombaire en attente de bloc facettaire lombaire et rendez-vous à physiatrie travailleurs donc consolider le travailleur revoit le docteur Leclerc le 17 mars 2025 il note une condition clinique stable il ajoute du sambalta et euh note l'arrêt complet de travail de 15 jours poste bloc face à terre il ajoute du sambalta et euh note l'arrêt complet de travail de 15 jours poste bloc face à terre`;

console.log('\n📝 Real-World Test Input:');
console.log(`Length: ${realWorldInput.length} characters`);
console.log('First 200 chars:', realWorldInput.substring(0, 200) + '...');
console.log('Last 200 chars:', '...' + realWorldInput.substring(realWorldInput.length - 200));

async function testFullRealWorld() {
  try {
    console.log('\n🔧 Testing Section 7 R&D Pipeline with Real-World Data...');
    
    const startTime = Date.now();
    const result = await section7RdService.processInput(realWorldInput);
    const endTime = Date.now();

    console.log('\n📊 R&D Pipeline Results:');
    console.log(`   - Success: ${result.success}`);
    console.log(`   - Processing Time: ${result.metadata.processingTime}ms`);
    console.log(`   - Version: ${result.metadata.version}`);
    console.log(`   - Total Time: ${endTime - startTime}ms`);

    console.log('\n📋 Compliance Results:');
    console.log(`   - Rules Score: ${(result.compliance.rulesScore * 100).toFixed(1)}%`);
    console.log(`   - Passed Rules: ${result.compliance.passedRules.length}`);
    console.log(`   - Failed Rules: ${result.compliance.failedRules.length}`);

    console.log('\n⚠️ Compliance Issues:');
    result.compliance.issues.forEach(issue => {
      console.log(`   - ${issue.rule}: ${issue.ok ? 'PASS' : 'FAIL'}${issue.message ? ` - ${issue.message}` : ''}`);
    });

    console.log('\n🎯 Quality Assurance:');
    console.log(`   - Line Similarity: ${(result.quality.lineSimilarity * 100).toFixed(1)}%`);
    console.log(`   - Manager Verdict: ${result.quality.managerVerdict}`);
    console.log(`   - Feedback: ${result.quality.feedback}`);

    console.log('\n📄 Formatted Output:');
    console.log('=' .repeat(80));
    console.log(result.formattedText);
    console.log('=' .repeat(80));

    // Detailed Analysis
    console.log('\n🔍 Detailed Analysis:');
    
    // Check patient verbatim capture
    const hasPatientQuotes = result.formattedText.includes('«') && result.formattedText.includes('»');
    const patientQuoteCount = (result.formattedText.match(/«[^»]*»/g) || []).length;
    console.log(`   - Patient verbatim quotes: ${hasPatientQuotes ? '✅' : '❌'} (${patientQuoteCount} quotes)`);
    
    // Check radiologist verbatim capture
    const hasRadiologySection = result.formattedText.includes('radiologiste') || result.formattedText.includes('radiographie');
    const hasRadiologyQuotes = result.formattedText.includes('radiologiste') && result.formattedText.includes('«');
    console.log(`   - Radiology section: ${hasRadiologySection ? '✅' : '❌'}`);
    console.log(`   - Radiology verbatim: ${hasRadiologyQuotes ? '✅' : '❌'}`);
    
    // Check structure
    const hasProperHeader = result.formattedText.startsWith('7. Historique de faits et évolution');
    const hasWorkerStructure = result.formattedText.includes('Le travailleur') || result.formattedText.includes('La travailleuse');
    const hasDoctorTitles = result.formattedText.includes('docteur');
    console.log(`   - Proper header: ${hasProperHeader ? '✅' : '❌'}`);
    console.log(`   - Worker structure: ${hasWorkerStructure ? '✅' : '❌'}`);
    console.log(`   - Doctor titles: ${hasDoctorTitles ? '✅' : '❌'}`);
    
    // Check chronological order
    const dates = result.formattedText.match(/\d{1,2}\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{4}/g) || [];
    console.log(`   - Dates found: ${dates.length} (${dates.join(', ')})`);
    
    // Check medical terminology
    const hasMedicalTerms = result.formattedText.includes('lombaire') || result.formattedText.includes('dorsal') || result.formattedText.includes('épaule');
    console.log(`   - Medical terminology: ${hasMedicalTerms ? '✅' : '❌'}`);

    // Summary
    console.log('\n🎯 Test Summary:');
    const overallSuccess = result.success && hasPatientQuotes && hasRadiologyQuotes && hasProperHeader && hasWorkerStructure;
    console.log(`   ✅ Pipeline Success: ${result.success ? 'YES' : 'NO'}`);
    console.log(`   ✅ Patient Verbatim: ${hasPatientQuotes ? 'YES' : 'NO'}`);
    console.log(`   ✅ Radiology Verbatim: ${hasRadiologyQuotes ? 'YES' : 'NO'}`);
    console.log(`   ✅ Structure: ${hasProperHeader && hasWorkerStructure ? 'YES' : 'NO'}`);
    console.log(`   ✅ Compliance: ${(result.compliance.rulesScore * 100).toFixed(1)}%`);
    console.log(`   ✅ Overall: ${overallSuccess ? 'SUCCESS' : 'NEEDS IMPROVEMENT'}`);

    if (overallSuccess) {
      console.log('\n🎉 SUCCESS: Section 7 R&D Pipeline is working perfectly with real-world data!');
    } else {
      console.log('\n⚠️ NEEDS IMPROVEMENT: Some issues detected in the pipeline.');
    }

    return overallSuccess;
  } catch (error) {
    console.error('❌ Full Real-World Test Failed:', error);
    return false;
  }
}

testFullRealWorld();
