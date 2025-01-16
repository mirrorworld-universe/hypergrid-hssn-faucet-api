import { config as dotEnvConfig } from 'dotenv';
dotEnvConfig();

import { WebClient } from '@slack/web-api';
import { Connection, PublicKey } from '@solana/web3.js';
import schedule from 'node-schedule';

const WALLET_ADDRESS = '2b1opjN2ztTRe3jit8gN3Qc6AVVo5jixKmSqzfU4jkjP';
const THRESHOLD = 100000;
const SLACK_TOKEN = process.env.SLACK_TOKEN as string;
const SLACK_CHANNEL = process.env.SLACK_CHANNEL as string;

const connection = new Connection('https://api.testnet.sonic.game');
const slack = new WebClient(SLACK_TOKEN);

async function checkFaucet() {
  try {
    const publicKey = new PublicKey(WALLET_ADDRESS);
    const balance = await connection.getBalance(publicKey);
    const solBalance = balance / 1e9;

    if (solBalance < THRESHOLD) {
      await slack.chat.postMessage({
        channel: SLACK_CHANNEL,
        text: `Warning: SOL balance for testnet faucet ${WALLET_ADDRESS} is below ${THRESHOLD}. Current testnet faucet balance: ${solBalance.toFixed(2)} SOL`
      });
    } else {
      await slack.chat.postMessage({
        channel: SLACK_CHANNEL,
        text: `Current testnet faucet balance: ${solBalance.toFixed(2)} SOL`
      });
    }
  } catch (error) {
    console.error('Error checking faucet:', error);
  }
}

schedule.scheduleJob({ hour: 7, minute: 0, second: 0 }, async () => {
  if (process.env.USE_CONTROLLER != 'sonic') {
    console.log("skip check faucet for non sonic controller")
    return;
  }
  console.log('Check Faucet Start @', new Date().toLocaleString('chinese', { hour12: false }));
  await checkFaucet();
  console.log('Check Faucet Done @', new Date().toLocaleString('chinese', { hour12: false }));
  console.log();
});
