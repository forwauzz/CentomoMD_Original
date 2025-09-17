// Test script for History of Evolution AI formatting
const testHistoryEvolutionFormatting = async () => {
  const testContent = `Le patient a subi un accident le 15 octobre 2023. Il a consulté le docteur Martin, le 16 octobre 2023. Le docteur a diagnostiqué une entorse du genou droit. Il a prescrit de la physiothérapie et un arrêt de travail. Le patient revoit le docteur Martin, le 30 octobre 2023. La condition s'est améliorée.`;

  try {
    console.log('🧪 Testing History of Evolution AI formatting...');
    console.log('📝 Input content:', testContent);
    
    const response = await fetch('http://localhost:3001/api/format-history-evolution', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: testContent,
        language: 'fr'
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('✅ Response received:');
    console.log('📊 Success:', result.success);
    console.log('📝 Formatted content:', result.formatted);
    console.log('🔗 Correlation ID:', result.correlationId);
    
    if (result.success) {
      console.log('🎉 History of Evolution formatting test PASSED!');
      
      // Check if worker-first rule was applied
      if (result.formatted.includes('Le travailleur') && !result.formatted.includes('Le patient')) {
        console.log('✅ Worker-first rule applied correctly');
      } else {
        console.log('⚠️  Worker-first rule may not have been applied');
      }
      
      // Check if chronological structure is correct
      if (result.formatted.includes('Le travailleur consulte') && result.formatted.includes('le 16 octobre 2023')) {
        console.log('✅ Chronological structure appears correct');
      } else {
        console.log('⚠️  Chronological structure may need review');
      }
    } else {
      console.log('❌ History of Evolution formatting test FAILED!');
      console.log('🔍 Issues:', result.issues);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
};

// Test the general template formatting endpoint
const testTemplateFormatting = async () => {
  const testContent = `Le patient a subi un accident le 15 octobre 2023. Il a consulté le docteur Martin, le 16 octobre 2023.`;

  try {
    console.log('\n🧪 Testing general template formatting with history_evolution section...');
    
    const response = await fetch('http://localhost:3001/api/templates/format', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: testContent,
        section: 'history_evolution',
        language: 'fr',
        complexity: 'medium',
        formattingLevel: 'advanced',
        includeSuggestions: true
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('✅ Template formatting response:');
    console.log('📊 Success:', result.success);
    
    if (result.success && result.data) {
      console.log('📝 Formatted content:', result.data.formatted);
      console.log('🔄 Changes:', result.data.changes);
      console.log('📈 Compliance:', result.data.compliance);
      console.log('🎉 Template formatting test PASSED!');
    } else {
      console.log('❌ Template formatting test FAILED!');
      console.log('🔍 Error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Template formatting test failed with error:', error);
  }
};

// Run both tests
const runTests = async () => {
  console.log('🚀 Starting History of Evolution formatting tests...\n');
  
  await testHistoryEvolutionFormatting();
  await testTemplateFormatting();
  
  console.log('\n🏁 Tests completed!');
};

// Run the tests
runTests();
