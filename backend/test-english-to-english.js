#!/usr/bin/env node

/**
 * Test script for English → English (EN→EN) scenario
 * Temporarily enables ALLOW_NON_FRENCH_OUTPUT for testing
 */

// Full English transcript as provided by user
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

async function testEnglishToEnglish() {
  console.log('🧪 Testing: English → English (EN→EN)');
  console.log('📝 Input Language: en');
  console.log('📤 Output Language: en');
  console.log('📄 Transcript Length:', ENGLISH_TRANSCRIPT.length, 'characters');
  console.log('⚠️  Note: This test requires ALLOW_NON_FRENCH_OUTPUT=true');
  
  const expectedHeaders = [
    "Subjective appraisal of progression:",
    "Complaints and problems:",
    "Functional impact:",
    "Neurological observations:",
    "Other observations:",
    "Exclusions / negative mentions:",
    "External references:"
  ];
  
  try {
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:3001/api/format/mode2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcript: ENGLISH_TRANSCRIPT,
        section: '8',
        inputLanguage: 'en',
        outputLanguage: 'en',
        templateId: 'section8-ai-formatter'
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
      
      if (errorText.includes('ALLOW_NON_FRENCH_OUTPUT is false')) {
        console.log('\n💡 SOLUTION: Enable English output for testing');
        console.log('   Set ALLOW_NON_FRENCH_OUTPUT=true in your environment');
        console.log('   Or modify the policy gate temporarily for testing');
      }
      return false;
    }

    const result = await response.json();
    
    // Check if we got formatted content
    if (!result.formatted || result.formatted.trim() === '') {
      console.log(`❌ No formatted content returned`);
      return false;
    }

    // Check if content is different from input (not a pass-through)
    if (result.formatted.trim() === ENGLISH_TRANSCRIPT.trim()) {
      console.log(`⚠️  Content identical to input (pass-through)`);
      console.log(`📄 Issues: ${result.issues?.join(', ') || 'None'}`);
      return false;
    }

    // Check for expected English headers
    const missingHeaders = expectedHeaders.filter(header => 
      !result.formatted.includes(header)
    );

    if (missingHeaders.length > 0) {
      console.log(`⚠️  Missing expected headers: ${missingHeaders.join(', ')}`);
    } else {
      console.log(`✅ All expected English headers present`);
    }

    // Show which headers were found
    console.log(`📋 Headers Found:`);
    expectedHeaders.forEach(header => {
      const found = result.formatted.includes(header);
      console.log(`   ${found ? '✅' : '❌'} ${header}`);
    });

    // Check for English indicators
    const englishIndicators = /[a-zA-Z]/;
    if (!englishIndicators.test(result.formatted)) {
      console.log(`⚠️  Expected English output but no English characters detected`);
    } else {
      console.log(`✅ English characters detected in output`);
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

  console.log('\n🚀 Testing English → English (EN→EN)');
  console.log('=' .repeat(80));
  
  const passed = await testEnglishToEnglish();
  
  console.log('\n📊 TEST SUMMARY');
  console.log('=' .repeat(80));
  if (passed) {
    console.log('🎉 English → English test passed!');
  } else {
    console.log('⚠️  English → English test failed or blocked by policy.');
    console.log('💡 To enable English output, set ALLOW_NON_FRENCH_OUTPUT=true');
  }
}

main().catch(console.error);
