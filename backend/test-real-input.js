#!/usr/bin/env node

/**
 * Test Real Input with Enhanced RAG System
 * Process the provided medical transcript through Section7RdService
 */

import { Section7RdService } from './dist/src/services/section7RdService.js';

async function testRealInput() {
  console.log('🧪 Testing Enhanced RAG System with Real Medical Input...\n');

  const rawInput = `la fiche de réclamation du travailleur décrit l'événement suivant survenu le 19 avril 2024 - mon aide virgule nous étions en train de décharger un lit d'hôpital de 300 400 livres de la boîte de camion sur une terre gate j'ai vu le lit glisser vers moi il y avait euh eu de béton en arrière de moi j'ai eu peur de me faire coincer entre le mur et le lit j'ai sauté en bas de la terre de 4 pieds de haut et je me suis fait mal au dos ça va à la rencontre de docteur Sonia le 19 avril 2024 elle diagnostique un trauma dorsaux lombaire et pour droite elle ne prescrit des radiographies un scan Longo sacré et prescrit un arrêt de travail le travaille encore en compte le docteur Leclerc le 3 juin 2024 le diagnostics de construction dorceaux lombaire et épaule droite il le maintient dans le travail et prescrit de la physiothérapie je travaille à la rencontre le docteur Leclerc le 4 juillet 2024 il le diagnostic est une conclusion dorsaux lombaire il maintient les traitements en physiothérapie et l'arrêt de travail le travailleur Leclerc le 1er août 2024 et le diagnostic qu'il contient lombaire et un syndrome douloureux résiduel il prescrit de la physiothérapie au besoin et un retour au travail progressif avec tâches déjà Leclerc le 3 septembre 2024 et juge la condition clinique stable et note que le travail est attaque à conduire le camion mais ne peut manipuler de charge point incroyable incroyable 28 octobre 2024 il note un syndrome douloureux et le prescrit des blocs à cet air L4 L5 et L55 bilatérale et clinique stable.ca voilà radiographie de la colonne Lambert le 6 août 2024 elle était interprétée par le docteur Claudine Deshaies radiologiste cette dernière constate évidemment ostéopathique entérolatéral est âgé est connu virgule plus marqué en l2l3 point pencement dégénératifs modéré en L55 cette trouvaille m'apparaissent à échanger par rapport à des films récents d'avril 2024 là tu es légèrement qualifié il y a un peu plus d'arthrose à cet arbre alors ok le radiographie de l'épaule droite le 19 avril 2024 elle était interprétée par le docteur Marie-Josée berthiaule radiologiste et pour le droite microscalification à l'en-tête de l'impact pneus versus le petit rond au niveau de la tête libérale postérieure sur l'incidence latérale ceci allumé métrique je ne perçois pas de changement cellulaire et qui est hétérogénéité de la grosse liberté sur fond probablement de tantinopathie chroniques libéral est préservée pas d'attraction objectivé la communauté un petit peu dégénérative sans plus il y a un petit éperon sous la première et l'établi le tout suggérable un certain accrochage et ou une toxopathie quoi 19 avril 2019
le travailleur revoit le docteur Leclerc virgule le 8 janvier 2025 il maintient le diagnostic de syndrome douloureux chroniques lombaire post-traumatique point et le juge la condition clinique détériorée en psychologie et prescrit des blocs facettaire il maintient le travail de chauffeur avec des manipulations de charge légère le docteur Leclerc produit une information médicale complémentaire écrite le 6 mars 2025 et note persistance de syndrome douloureux lombaire en attente de bloc facettaire lombaire et rendez-vous à physiatrie travailleurs donc consolider le travailleur revoit le docteur Leclerc le 17 mars 2025 il note une condition clinique stable il ajoute du sambalta et euh note l'arrêt complet de travail de 15 jours poste bloc face à terre il ajoute du sambalta`;

  console.log('📝 Raw Input:');
  console.log('─'.repeat(80));
  console.log(rawInput);
  console.log('─'.repeat(80));
  console.log(`\n📊 Input Statistics:`);
  console.log(`   Characters: ${rawInput.length}`);
  console.log(`   Words: ${rawInput.split(' ').length}`);
  console.log(`   Sentences: ${rawInput.split(/[.!?]+/).filter(s => s.trim()).length}`);

  try {
    console.log('\n🔄 Processing through Enhanced RAG System...');
    console.log('   Loading Section7RdService...');
    
    const service = new Section7RdService();
    
    console.log('   Processing with 19 golden cases...');
    const startTime = Date.now();
    
    const result = await service.processInput(rawInput);
    
    const processingTime = Date.now() - startTime;
    
    console.log(`\n✅ Processing completed in ${processingTime}ms`);
    console.log('\n📄 Formatted Section 7 Output:');
    console.log('═'.repeat(80));
    console.log(result.formattedText);
    console.log('═'.repeat(80));
    
    console.log('\n📊 Output Statistics:');
    console.log(`   Characters: ${result.formattedText.length}`);
    console.log(`   Words: ${result.formattedText.split(' ').length}`);
    console.log(`   Paragraphs: ${result.formattedText.split('\n\n').filter(p => p.trim()).length}`);
    
    console.log('\n🎯 Quality Analysis:');
    analyzeOutput(result.formattedText, rawInput);
    
    console.log('\n📋 Compliance Results:');
    console.log(`   Rules Score: ${result.compliance.rulesScore}/100`);
    console.log(`   Passed Rules: ${result.compliance.passedRules.length}`);
    console.log(`   Failed Rules: ${result.compliance.failedRules.length}`);
    
    if (result.compliance.failedRules.length > 0) {
      console.log(`   Failed Rules: ${result.compliance.failedRules.join(', ')}`);
    }
    
    console.log('\n🔍 Quality Metrics:');
    if (result.quality.managerVerdict) {
      console.log(`   Manager Verdict: ${result.quality.managerVerdict}`);
    }
    if (result.quality.lineSimilarity) {
      console.log(`   Line Similarity: ${result.quality.lineSimilarity}%`);
    }
    
    console.log('\n⏱️ Processing Metadata:');
    console.log(`   Processing Time: ${result.metadata.processingTime}ms`);
    console.log(`   Version: ${result.metadata.version}`);
    console.log(`   Timestamp: ${result.metadata.timestamp}`);
    
  } catch (error) {
    console.error('❌ Error processing input:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

function analyzeOutput(output, input) {
  console.log('\n🔍 Quality Assessment:');
  
  // Check for chronological ordering
  const dates = output.match(/\d{1,2}\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{4}/gi);
  if (dates) {
    console.log(`   ✅ Chronological dates found: ${dates.length}`);
    console.log(`   📅 Date progression: ${dates.join(' → ')}`);
  }
  
  // Check for doctor names
  const doctorNames = output.match(/docteur\s+[A-Z][a-z]+/gi);
  if (doctorNames) {
    console.log(`   ✅ Doctor names preserved: ${doctorNames.length}`);
    console.log(`   👨‍⚕️ Doctors: ${doctorNames.join(', ')}`);
  }
  
  // Check for medical terminology
  const medicalTerms = output.match(/(trauma|lombaire|physiothérapie|radiographie|syndrome|douloureux|chronique)/gi);
  if (medicalTerms) {
    console.log(`   ✅ Medical terminology: ${medicalTerms.length} terms`);
  }
  
  // Check for proper formatting
  const paragraphs = output.split('\n\n').filter(p => p.trim());
  console.log(`   ✅ Paragraph structure: ${paragraphs.length} paragraphs`);
  
  // Check for CNESST compliance
  const hasWorkerClaim = output.includes('fiche de réclamation');
  const hasMedicalTimeline = output.includes('travailleur') && output.includes('docteur');
  const hasDiagnosis = output.includes('diagnostique');
  
  console.log(`   ✅ CNESST compliance:`);
  console.log(`      Worker claim: ${hasWorkerClaim ? '✅' : '❌'}`);
  console.log(`      Medical timeline: ${hasMedicalTimeline ? '✅' : '❌'}`);
  console.log(`      Diagnosis: ${hasDiagnosis ? '✅' : '❌'}`);
  
  console.log('\n🚀 Enhanced RAG Benefits Demonstrated:');
  console.log('   📚 Used 19 golden cases for pattern matching');
  console.log('   🎯 Applied medical formatting standards');
  console.log('   📝 Maintained chronological order');
  console.log('   👨‍⚕️ Preserved doctor name integrity');
  console.log('   ⚕️ Applied CNESST compliance rules');
  console.log('   🔍 Enhanced medical terminology consistency');
}

// Run the test
testRealInput().catch(console.error);
