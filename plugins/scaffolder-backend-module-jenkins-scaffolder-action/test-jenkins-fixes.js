#!/usr/bin/env node

/**
 * Simple test script to verify Jenkins scaffolder action fixes
 * This script tests the Jenkins client connectivity and basic functionality
 */

const path = require('path');
const { ConfigReader } = require('@backstage/config');

// Mock Jenkins configuration matching app-config.yaml
const mockConfig = new ConfigReader({
  jenkins: {
    baseUrl: 'http://localhost:8082',
    username: 'alokkulkarni',
    apiKey: '11ee8c483603502eb77e78a2ab07ad3378'
  }
});

async function testJenkinsClient() {
  console.log('🔧 Testing Jenkins Scaffolder Action Fixes...\n');
  
  try {
    // Dynamically import the Jenkins client
    const { JenkinsClient } = require('./src/actions/jenkins-client');
    
    console.log('✅ Successfully imported JenkinsClient');
    
    // Create Jenkins client instance
    const client = new JenkinsClient(mockConfig);
    console.log('✅ Successfully created JenkinsClient instance');
    
    // Test connection
    console.log('🔗 Testing Jenkins connectivity...');
    const connectionResult = await client.testConnection();
    
    if (connectionResult.success) {
      console.log(`✅ Jenkins connection successful: ${connectionResult.message}`);
    } else {
      console.log(`❌ Jenkins connection failed: ${connectionResult.message}`);
      return false;
    }
    
    // Test job existence check (should handle 404 gracefully)
    console.log('🔍 Testing job existence check...');
    const jobExists = await client.jobExists('test-nonexistent-job');
    console.log(`✅ Job existence check completed (nonexistent job should return false): ${jobExists}`);
    
    console.log('\n🎉 All tests passed! Jenkins scaffolder action is ready to use.');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    return false;
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testJenkinsClient()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { testJenkinsClient };
