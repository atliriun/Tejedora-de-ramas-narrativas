const https = require('https');

https.get('https://ais-pre-gpq3agg7w2biowgklknvuy-15975184865.us-west1.run.app/mcp/sse', (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  res.on('data', d => process.stdout.write(d));
});
