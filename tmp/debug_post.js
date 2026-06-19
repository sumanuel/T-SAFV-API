const http = require('http');

const data = JSON.stringify({ nombre: 'Dbg', email: 'dbg@example.com', password: 'Secret123!' });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  let raw = '';
  res.on('data', (chunk) => (raw += chunk));
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', raw);
  });
});

req.on('error', (e) => console.error('Request error:', e.message));
req.write(data);
req.end();

