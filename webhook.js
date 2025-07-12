// ~/Productivityapp/webhook.js
import express from 'express';
import crypto from 'crypto';
import { exec } from 'child_process';
import bodyParser from 'body-parser';

const app = express();
const PORT = 4000;
const SECRET = 'your_webhook_secret'; // Replace with your real webhook secret

app.use(bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

app.post('/github-webhook', (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const hmac = crypto.createHmac('sha256', SECRET);
  const digest = 'sha256=' + hmac.update(req.rawBody).digest('hex');

  if (signature !== digest) {
    return res.status(403).send('Invalid signature');
  }

  // Run the deployment script
  exec('/bin/bash ~/Productivityapp/deploy.sh', (err, stdout, stderr) => {
    if (err) {
      console.error('❌ Deploy error:', stderr);
      return res.status(500).send('Deployment failed');
    }

    console.log('✅ Deploy output:', stdout);
    res.status(200).send('Deployment successful');
  });
});

app.listen(PORT, () => {
  console.log(`✅ Webhook listening on port ${PORT}`);
});
