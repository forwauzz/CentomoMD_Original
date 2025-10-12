#!/usr/bin/env node

/**
 * Test script for Section 7 Output Language Selection Feature
 * Tests both English→French and French→French scenarios for Section 7
 */

// Test data
const FRENCH_TRANSCRIPT = `0: excellent, fait que aujourd'hui, c'est comme c'est bizarre comme rencontre parce que je ne vous vois pas pour le le l'opération que j'ai fait, je vous rends compte pour la CNEST parce que quand vous vous êtes blessé, euh le.

1: le juin 2024, il y a eu des blessures aussi au dos.

0: que je vais regarder ça aussi pour le coude, c'est difficile parce que je viens juste de vous opérer, fait que je.

0: La CNSST ne reconnaît pas l'épicondilte, la chirurgie que je vous ai faite là, ça, il le reconnaît pas, mais elle reconnaît juste une contusion au coude.

0: Et moi aujourd'hui, je peux pas dire que vous êtes guéri du coude, parce que je viens juste de vous opérer, fait que c'est sûr que le code, il marche pas encore bien, ça fait juste un mois que je vous ai opéré. Fait que on va surtout regarder le dos. Puis je vais donner mes recommandations à la CNSST. Vous avec moi, c'est quand votre votre prochain rendez-vous 27 novembre, OK. euh donc moi j'avais dans le dossier que vous étiez droitière euh avez-vous des allergies à des médicaments?

2: euh, tu penses que oui, dernièrement, parce que tu sais pas la toi, tu fais des petits boutons, ouais, okay.

0: Mais vous ne savez pas, ouais, c'est ça que, qui, euh, est-ce que vous consommez de l'alcool? non occasionnel. Et puis le cannabis, non, OK, parfait.

0: Puis, ça faisait combien de temps que vous travaillez pour euh super service Montréal?

1: euh.

2: parce que 2021, okay, puis avant l'accident, vous travaillez à temps plein. C'est combien d'heures semaine 40 heures semaine.

0: là, vous faites en ce moment avez-vous commencé à faire la physio puis tout ça puis êtes vous en arrêt de travail depuis 2024 depuis l'accident? Ouais.

0: est ce que c'est la première fois que vous déclarez une blessure à la CNSST? Vous voyez?

0: puis avez-vous déjà eu un accident de voiture déclaré à la SAC ou des choses comme ça, non? OK.

0: Puis j'avais que vous avez le diabète, l'hypertension, puis le cholestérol, c'est ça?

0: Puis vous, si on se concentre plus par rapport au dos, est-ce que vous seriez capable de.

0: de retourner au travail avec le dos, même le dos, vous ne seriez pas capable, je sais pas si vous me manipuler un peu parce que c'est de l'or.

2: fait, la douleur au niveau de la fesse gauche, c'est ça? OK, OK, OK OK, OK OK, OK OK, OK OK, OK OK, OK OK,, suivez-vous?

2: Parce qu'ils amélioré, mais au jour, je suis allé au centre ville, j'ai marché pas mal. Beaucoup, ouais.

2: Et là, c'est comme dire okay.

2: C'est vraiment, c'est vraiment de, il y avait toute la journée avec la chaleur parce que ça, ça fait mal d'éplorer Fait que la douleur vraiment à la fesse, puis au bas du dos, hein. OK. Puis est-ce que ça, ça descend dans votre jambe, dans la jambe gauche.

0: de la fesse jusqu'aux genoux, ok, en externe, ok, fait que c'est la douleur, c'est surtout à la fesse, okay, okay. qui m'ont proposé à à la fure, c'est Fona indu.

2: le doigt dans.

0: je ne connais pas ça, c'est vraiment pas mon domaine là, les doigts pour aller chercher le cactus, puis le, okay, ouais, ça, c'est, je connais, je connais, euh.

1: je connais pas ça. Puis est-ce que euh 0: il y a des douleurs justement ou des engourdissements autour de la nuce ou autour des parties génitales. Tout ça ou vous ne sentez pas non ok fait qu'il n'y a pas de symptômes, on dit sp terrien ok parfait une fois par mois. Ouais.

2: Parce que lui, c'est pas, c'est comme magasin parce que des fois, il les ppi qui un peu euh.

0: Okay.

0: puis est-ce que euh.

0: Qu'est-ce qui augmente les douleurs à votre dos, c'est tu de bouger, de rester assis longtemps, un peu de tout, comme il était avec hôtel, ouais, ouais. moment que j'ai commencé à quand j'ai marre, c'est comme ma date de 80, c'est. j'étais beaucoup touché avant hier mal la douleur avant hier mal la douleur avant hier mal la douleur. Donc, c'est surtout, bah les positions debout.

0: longtemps ou si longtemps ou de bouger le tronc tout ça de vous pencher, ça, ça augmente vos douleurs, je ne pense pas trop, je okay. Puis par rapport à votre coude là, est-ce que depuis la chirurgie, vous trouvez que ça s'amélioré un peu, c'est c'est un peu ce matin, je ne sais pas si c'est le froid qui sont un peu la douleur. Vous avez quand même des raideurs le matin hein, c'est ça. Puis la douleur est surtout en externe.

0: de gauche, puis qu'est-ce, est-ce que quand vous bougez le coude, ça fait mal, ouais, ça augmente la douleur que vous trouvez que ça s'améliore. OK, parfait. Oui, les exercices sont parfaits, ça 2: Ah, c'est un téléphone, okay.

0: est-ce qu'il y a des choses que vous voudriez rajouter par rapport à vos douleurs, aux aux coudes ou au dos, c'est plus normal que fait que ça la monte jusque dans le cou, dans l'épaule gauche là ok puis du cote gauche de votre cou c'est c'est quoi comme douleur, ça brûle, ça chauffe.

2: fait ce fait que vous vous sentez comme raide, une pression, puis c'est raide dans le cou, puis dans l'épaule ici par exemple.

2: de.

2: Ouais.

2: allons au niveau du caccus, ça fait pas mal, mais ici, ici.`;

const ENGLISH_TRANSCRIPT = `0: Right 0: So I, again, can you just um explain me again how you injured your back.

3: Um, so I was, uh, working a late shift in the warehouse and uh, you know, I was quite into lift, um, a 3: a heavy box, and I think I, you know, I pulled a muscle in my back hurts now.

1: Yeah, all right. And I saw in, in, in your chart that you, uh, yeah, yeah.

0: I saw in your chart that uh you, you're not back to work right now, do you feel that at some point you may be able to go back to work as as your your last job that you were doing.

1: Um 1: I, I think maybe I.

1: I, I, I will, I just need a little bit more time because, you know, at the moment I'm not able to 1: go to the gym and that lift and 1: do all these exercises. So I feel maybe I just need more time.

1: for it to heal 1: Um.

1: yeah.

0: OK. So, right now, are you doing some physio exercises and all that stuff.

1: yeah, I started with a physio, but it was just the uh first consultation and 1: he just kind of felt where the, the pain was radiated from, um, and he planned to start a full 1: 3 weeks or 4 weeks, um, um.

1: plan to, to, to help me with the, with the pain. OK. So, what bothered you the most, uh, of your back right now. It's, um, when I, uh, tried to, uh, bend down to pick something, um, so that that hurts. Um, and squatting as well also hurts.

0: OK. Does you, you have any like.

0: pain that goes from your back to your legs or just the.

0: in your back or just in your legs or. Um, so from my back to sometimes to my legs, and I feel my legs tremble like it's almost can't hold the weight, um 1: yeah, so sometimes it radiates down to my legs. OK. Does it come numb or do you still feel the the touch on your skin or you feel that it's kind of numb or? Um, no, it's, uh, it doesn't really get numb. OK. No.

0: And in your back, do you have like a burning pain, a pressure pain, or like a stabing or.

2: Um, in my back, it's, it's, uh, it's like a stab, stabbing pain. Stab. OK. And do you, do you see some that you will do that will kind of.

0: uh augment your pain or uh kind of uh exacerbism, which means that you have will, you will have more pain doing this, this kind of movement or this kind of exercises. Um, I think it's really when I try to lift very heavy boxes or heavy.

1: objects. If I just, I mean, the, the least amount of 1: uh activity I do that doesn't earn this uh 1: it's just sitting down and 1: standing 1: um, but if I try to 1: you know.

1: lift something heavy, then that's when I feel.

2: OK 0: So no pain or no like bigger pain when you're kind of bending forward without any object, just kind of moving your spine. Yeah. You feel OK with that? Exactly. OK.

0: And, uh, does the pain wake you up at night? Um, yeah, sometimes, uh, sometimes I feel the, the, 1: the the the pain but not so sharp, but um.

1: it's, I feel it and then I take a few moments and I'm able to.

1: to sleep without taking any painkillers. OK. And you feel any like problem going kind of up and down hills or uh like walking up and down hill or or staying like.

0: straight without moving, like the standing posture. Um, yeah, so going up and down hills, so the steps, yeah, that's uh that.

1: usually is, this is some discomfort.

1: um, standing straight for maybe 1: even than uh.

1: 10 minutes, then I start to feel the pain, but, uh, just going about my regular 1: day to day.

1: I.

1: it doesn't hurt that much 0: Right.`;

// Test scenarios for Section 7
const TEST_SCENARIOS = [
  {
    name: "Section 7: French → French (FR→FR)",
    inputLanguage: "fr",
    outputLanguage: "fr",
    transcript: FRENCH_TRANSCRIPT,
    section: "7",
    templateId: "section7-ai-formatter",
    expectedHeaders: [
      "Identification du travailleur :",
      "Antécédents médicaux :",
      "Événement accidentel :",
      "Évolution depuis l'accident :"
    ]
  },
  {
    name: "Section 7: English → French (EN→FR)",
    inputLanguage: "en", 
    outputLanguage: "fr",
    transcript: ENGLISH_TRANSCRIPT,
    section: "7",
    templateId: "section7-ai-formatter",
    expectedHeaders: [
      "Identification du travailleur :",
      "Antécédents médicaux :",
      "Événement accidentel :",
      "Évolution depuis l'accident :"
    ]
  }
];

async function testScenario(scenario) {
  console.log(`\n🧪 Testing: ${scenario.name}`);
  console.log(`📝 Input Language: ${scenario.inputLanguage}`);
  console.log(`📤 Output Language: ${scenario.outputLanguage}`);
  console.log(`📄 Section: ${scenario.section}`);
  console.log(`🏷️  Template ID: ${scenario.templateId}`);
  console.log(`📄 Transcript Length: ${scenario.transcript.length} characters`);
  
  try {
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:3001/api/format/mode2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcript: scenario.transcript,
        section: scenario.section,
        inputLanguage: scenario.inputLanguage,
        outputLanguage: scenario.outputLanguage,
        templateId: scenario.templateId
      })
    });

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    console.log(`⏱️  Processing Time: ${processingTime}ms`);
    console.log(`📊 Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      console.log(`📄 Error Response: ${errorText}`);
      return false;
    }

    const result = await response.json();
    
    // Check if we got formatted content
    if (!result.formatted || result.formatted.trim() === '') {
      console.log(`❌ No formatted content returned`);
      return false;
    }

    // Check if content is different from input (not a pass-through)
    if (result.formatted.trim() === scenario.transcript.trim()) {
      console.log(`⚠️  Content identical to input (pass-through)`);
      console.log(`📄 Issues: ${result.issues?.join(', ') || 'None'}`);
      return false;
    }

    // Check for expected headers
    const missingHeaders = scenario.expectedHeaders.filter(header => 
      !result.formatted.includes(header)
    );

    if (missingHeaders.length > 0) {
      console.log(`⚠️  Missing expected headers: ${missingHeaders.join(', ')}`);
    } else {
      console.log(`✅ All expected Section 7 headers present`);
    }

    // Show which headers were found
    console.log(`📋 Headers Found:`);
    scenario.expectedHeaders.forEach(header => {
      const found = result.formatted.includes(header);
      console.log(`   ${found ? '✅' : '❌'} ${header}`);
    });

    // Check for French indicators (for French output)
    if (scenario.outputLanguage === 'fr') {
      const frenchIndicators = /[àâçéèêëîïôùûüÿœ]/i;
      if (!frenchIndicators.test(result.formatted)) {
        console.log(`⚠️  Expected French output but no French characters detected`);
      } else {
        console.log(`✅ French characters detected in output`);
      }
    }

    // Show full formatted content
    console.log(`\n📄 FULL FORMATTED CONTENT:`);
    console.log('─'.repeat(80));
    console.log(result.formatted);
    console.log('─'.repeat(80));
    
    // Show issues if any
    if (result.issues && result.issues.length > 0) {
      console.log(`\n⚠️  Issues: ${result.issues.join(', ')}`);
    } else {
      console.log(`\n✅ No issues reported`);
    }

    // Show confidence score
    if (result.confidence_score !== undefined) {
      console.log(`📊 Confidence Score: ${result.confidence_score}`);
    }

    // Show clinical entities if available
    if (result.clinical_entities) {
      console.log(`\n🏥 Clinical Entities Extracted:`);
      console.log(JSON.stringify(result.clinical_entities, null, 2));
    }

    return true;

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Section 7 Output Language Selection Tests');
  console.log('=' .repeat(80));
  
  let passedTests = 0;
  let totalTests = TEST_SCENARIOS.length;

  for (const scenario of TEST_SCENARIOS) {
    const passed = await testScenario(scenario);
    if (passed) {
      passedTests++;
    }
    console.log('\n' + '='.repeat(80));
  }

  console.log('\n📊 TEST SUMMARY');
  console.log('=' .repeat(80));
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All Section 7 tests passed! Output language selection is working correctly.');
  } else {
    console.log('⚠️  Some Section 7 tests failed. Check the logs above for details.');
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3001/api/config');
    if (response.ok) {
      console.log('✅ Backend server is running');
      return true;
    }
  } catch (error) {
    console.log('❌ Backend server is not running or not accessible');
    console.log('   Please start the backend server with: npm run dev');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔍 Checking backend server...');
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    process.exit(1);
  }

  await runAllTests();
}

main().catch(console.error);
