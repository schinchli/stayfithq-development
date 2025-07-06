#!/usr/bin/env node

/**
 * Test Health Data Processing
 * Demonstrates the StayFit Health Companion processing capabilities
 */

const LocalHealthProcessor = require('./src/processors/local-health-processor');
const path = require('path');
const fs = require('fs').promises;

async function testHealthProcessing() {
  console.log('🏥 StayFit Health Companion - Processing Test\n');

  const processor = new LocalHealthProcessor();
  
  try {
    // Test with the HR folder containing Apple Health export and PDF health reports
    const hrFolderPath = '/Users/schinchli/Documents/HR';
    
    console.log(`📁 Processing health data from: ${hrFolderPath}`);
    console.log('   This folder contains:');
    console.log('   • Apple Health export (120MB XML with 282,698 records)');
    console.log('   • PDF health reports for 2023, 2024, 2025');
    console.log('');

    // Check if HR folder exists
    try {
      await fs.access(hrFolderPath);
      console.log('✅ HR folder found, starting processing...\n');
    } catch (error) {
      console.log('⚠️  HR folder not found, using simulated data for demonstration\n');
      
      // Create a test folder with simulated data
      const testFolder = path.join(__dirname, 'test-data');
      await createTestData(testFolder);
      
      console.log('📊 Processing simulated health data...\n');
      const results = await processor.processHealthDataFolder(testFolder);
      displayResults(results);
      return;
    }

    // Process the actual HR folder
    const results = await processor.processHealthDataFolder(hrFolderPath);
    displayResults(results);

    // Test MCP server tools simulation
    console.log('\n🔧 Testing MCP Server Tools:\n');
    await testMCPTools(processor);

  } catch (error) {
    console.error('❌ Error during health processing:', error.message);
  }
}

async function createTestData(testFolder) {
  try {
    await fs.mkdir(testFolder, { recursive: true });
    
    // Create a simulated Apple Health export
    const appleHealthXML = `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="en_US">
  <Record type="HKQuantityTypeIdentifierStepCount" sourceName="iPhone" value="1247" unit="count" creationDate="2024-06-27 10:00:00" startDate="2024-06-27 00:00:00" endDate="2024-06-27 23:59:59"/>
  <Record type="HKQuantityTypeIdentifierHeartRate" sourceName="Apple Watch" value="72" unit="count/min" creationDate="2024-06-27 12:00:00" startDate="2024-06-27 12:00:00" endDate="2024-06-27 12:00:00"/>
  <Record type="HKQuantityTypeIdentifierStepCount" sourceName="iPhone" value="2156" unit="count" creationDate="2024-06-26 10:00:00" startDate="2024-06-26 00:00:00" endDate="2024-06-26 23:59:59"/>
  <Workout workoutActivityType="HKWorkoutActivityTypeRunning" duration="30" durationUnit="min" totalDistance="3.2" totalDistanceUnit="mi" totalEnergyBurned="350" totalEnergyBurnedUnit="kcal" sourceName="Apple Watch" creationDate="2024-06-27 07:00:00" startDate="2024-06-27 07:00:00" endDate="2024-06-27 07:30:00"/>
</HealthData>`;

    await fs.writeFile(path.join(testFolder, 'apple_health_export.xml'), appleHealthXML);
    
    console.log('✅ Created simulated Apple Health export');

  } catch (error) {
    console.error('Error creating test data:', error);
  }
}

function displayResults(results) {
  console.log('📊 Processing Results:\n');
  
  // Apple Health Results
  if (results.apple_health_results.length > 0) {
    console.log('🍎 Apple Health Processing:');
    results.apple_health_results.forEach((result, index) => {
      const summary = result.result.summary;
      console.log(`   File ${index + 1}: ${path.basename(result.file)}`);
      console.log(`   • Total records: ${summary.total_records_processed || 'N/A'}`);
      console.log(`   • Steps records: ${summary.steps_records || 0}`);
      console.log(`   • Heart rate records: ${summary.heart_rate_records || 0}`);
      console.log(`   • Workout records: ${summary.workout_records || 0}`);
      
      if (summary.daily_step_stats) {
        console.log(`   • Daily step average: ${Math.round(summary.daily_step_stats.average)} steps`);
        console.log(`   • Step range: ${Math.round(summary.daily_step_stats.min)} - ${Math.round(summary.daily_step_stats.max)} steps`);
      }
      console.log('');
    });
  }

  // PDF Results
  if (results.pdf_results.length > 0) {
    console.log('📄 PDF Document Processing:');
    results.pdf_results.forEach((result, index) => {
      console.log(`   Document ${index + 1}: ${path.basename(result.file)}`);
      console.log(`   • Type: ${result.result.document_type}`);
      console.log(`   • Extraction confidence: ${result.result.extraction_confidence}%`);
      console.log(`   • Health insights: ${result.result.health_insights.length}`);
      console.log('');
    });
  }

  // Combined Insights
  if (results.combined_insights.length > 0) {
    console.log('💡 Combined Health Insights:');
    results.combined_insights.forEach((insight, index) => {
      const icon = insight.type === 'alert' ? '⚠️' : insight.type === 'recommendation' ? '💡' : '✅';
      console.log(`   ${icon} ${insight.message}`);
      if (insight.recommendation) {
        console.log(`      → ${insight.recommendation}`);
      }
      console.log('');
    });
  }

  // Processing Errors
  if (results.processing_errors.length > 0) {
    console.log('❌ Processing Errors:');
    results.processing_errors.forEach(error => {
      console.log(`   • ${path.basename(error.file)}: ${error.error}`);
    });
    console.log('');
  }
}

async function testMCPTools(processor) {
  // Simulate MCP tool calls
  const testCalls = [
    {
      tool: 'search_health_data',
      args: { query: 'steps', date_range: { start: '2024-06-01', end: '2024-06-30' } },
      description: 'Search for step data in June 2024'
    },
    {
      tool: 'generate_health_insights',
      args: { user_id: 'test_user', insight_type: 'trends', time_period: 'month' },
      description: 'Generate monthly health trends'
    },
    {
      tool: 'get_family_health_summary',
      args: { family_id: 'test_family', privacy_level: 'basic' },
      description: 'Get basic family health summary'
    }
  ];

  for (const testCall of testCalls) {
    console.log(`🔧 Testing: ${testCall.description}`);
    console.log(`   Tool: ${testCall.tool}`);
    console.log(`   Args: ${JSON.stringify(testCall.args, null, 2)}`);
    console.log('   Result: MCP tool would process this request with cached health data');
    console.log('');
  }

  // Display cache statistics simulation
  console.log('📊 Cache Statistics (Simulated):');
  console.log('   • Cache type: Redis with in-memory fallback');
  console.log('   • Hit rate: 85%');
  console.log('   • Cached entries: 1,247');
  console.log('   • 30-day retention policy active');
  console.log('');

  // Display data quality assessment
  const summary = processor.getProcessedDataSummary();
  console.log('📈 Data Quality Assessment:');
  console.log(`   • Apple Health data: ${summary.has_apple_health_data ? 'Available' : 'Not available'}`);
  console.log(`   • PDF documents: ${summary.pdf_documents_count} processed`);
  console.log(`   • Health insights: ${summary.insights_count} generated`);
  if (summary.data_quality) {
    console.log(`   • Quality score: ${summary.data_quality.score}/100 (${summary.data_quality.grade})`);
  }
}

// Run the test
if (require.main === module) {
  testHealthProcessing().catch(console.error);
}

module.exports = { testHealthProcessing };
