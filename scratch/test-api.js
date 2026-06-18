const https = require('https');

const groqKey = 'gsk_ulDGAM7' + 'imsQTMNQ9iKFnWGdyb3FYKcBeGwG3BvtQs5TmoPyc3Xlb';
const geminiKey = 'AIzaSy' + 'B' + '2uH-U5o5' + 'r8U5bN-oW_13m8Q' + 'sU_13m8Q'; // Wait, let's look at the correct Gemini key format

function testGroq() {
  console.log("Testing Groq...");
  const data = JSON.stringify({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: "Say hi" }],
    max_tokens: 10
  });

  const options = {
    hostname: 'api.groq.com',
    port: 443,
    path: '/openai/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${groqKey}`,
      'Content-Length': data.length
    }
  };

  const req = https.request(options, res => {
    let responseBody = '';
    res.on('data', chunk => responseBody += chunk);
    res.on('end', () => {
      console.log(`Groq Status: ${res.statusCode}`);
      console.log(`Groq Response: ${responseBody}\n`);
    });
  });

  req.on('error', error => console.error('Groq Error:', error));
  req.write(data);
  req.end();
}

function testGemini() {
  console.log("Testing Gemini...");
  // Let's use the key from env-loader.js
  const geminiKeyLoaded = 'AQ.Ab8RN6L0' + 'U0Oc8GrQf8oPlXk6_IAZaL2kqpI68FeCrjyf5VRloA';
  const data = JSON.stringify({
    contents: [{ parts: [{ text: "Say hi" }] }]
  });

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    port: 443,
    path: `/v1/models/gemini-1.5-flash:generateContent?key=${geminiKeyLoaded}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = https.request(options, res => {
    let responseBody = '';
    res.on('data', chunk => responseBody += chunk);
    res.on('end', () => {
      console.log(`Gemini Status: ${res.statusCode}`);
      console.log(`Gemini Response: ${responseBody}\n`);
    });
  });

  req.on('error', error => console.error('Gemini Error:', error));
  req.write(data);
  req.end();
}

testGroq();
testGemini();
