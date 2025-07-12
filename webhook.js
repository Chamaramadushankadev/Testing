import express from 'express';
import crypto from 'crypto';
import { exec } from 'child_process';

const router = express.Router();

const SECRET = 'Chamara@1234'; // Your GitHub webhook secret

router.post('/webhook', express.raw({ type: '*/*' }), (req, res) => {
  const signature = `sha256=${crypto
    .createHmac('sha256', SECRET)
    .update(req.body)
    .digest('hex')}`;

  const trusted = req.headers['x-hub-signature-256'] === signature;

  if (!trusted) {
    console.log('❌ Invalid webhook signature');
    return res.status(403).send('Forbidden');
  }

  console.log('✅ Valid webhook triggered. Pulling latest code...');

  exec('sh ./deploy.sh', (err, stdout, stderr) => {
    if (err) {
      console.error(`Error: ${err.message}`);
      return res.status(500).send('Deployment failed');
    }

    if (stderr) console.error(`stderr: ${stderr}`);
    if (stdout) console.log(`stdout: ${stdout}`);

    res.status(200).send('Deployed!');
  });
});

export default router;
