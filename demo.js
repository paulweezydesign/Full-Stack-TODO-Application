const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testServer() {
  console.log('🧪 Testing Web Scraper Pro Server...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);
    console.log('   Database status:', healthResponse.data.database.status);
    console.log('   Services:', healthResponse.data.services);
    console.log('');

    // Test supported types endpoint
    console.log('2. Testing supported types endpoint...');
    const typesResponse = await axios.get(`${BASE_URL}/api/supported-types`);
    console.log('✅ Supported file types:', typesResponse.data.fileTypes.length);
    console.log('   Extensions:', typesResponse.data.extensions.length);
    console.log('');

    // Test export formats endpoint
    console.log('3. Testing export formats endpoint...');
    const exportResponse = await axios.get(`${BASE_URL}/api/export-formats`);
    console.log('✅ Export formats:', exportResponse.data.formats);
    console.log('');

    // Test knowledge base stats (should work even with empty DB)
    console.log('4. Testing knowledge base stats...');
    const statsResponse = await axios.get(`${BASE_URL}/api/knowledge/stats`);
    console.log('✅ Knowledge base stats retrieved');
    console.log('   Total pages:', statsResponse.data.totalPages);
    console.log('   Total files:', statsResponse.data.totalFiles);
    console.log('');

    console.log('🎉 All basic tests passed! Server is working correctly.');
    console.log('\n📱 You can now start the client with: cd Client && npm run dev');
    console.log('🌐 Server is running at:', BASE_URL);

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server is not running. Please start the server first:');
      console.log('   cd Server && npm run dev');
    } else {
      console.log('❌ Test failed:', error.message);
      if (error.response) {
        console.log('   Status:', error.response.status);
        console.log('   Data:', error.response.data);
      }
    }
  }
}

// Run the test
testServer();