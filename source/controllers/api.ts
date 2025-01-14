import { config as dotEnvConfig } from 'dotenv';
dotEnvConfig();

import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import axios from "axios";
import { Connection, PublicKey } from '@solana/web3.js';
// import cmd from 'node-cmd';
const cmd = require('node-cmd');

const apiBaseUrl = "https://challenges.cloudflare.com";
const secretKey = process.env.SECRETKEY as string;
const SOLANA_CLI_PATH = "/home/ubuntu/.local/share/solana/install/active_release/bin/solana";

const maxLimitPerAddr = 1;
const eightHoursTs = 1000 * 60 * 60 * 8;
let lastTs = 0;
let requestCounts: any = {};

// Add helper function
const validateSolanaAddress = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
}

const airdrop = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Add address validation
    if (!validateSolanaAddress(req.params.user)) {
      return res.status(401).json({ error: 'Invalid Solana address' });
    }

    // Add amount validation 
    const amount = Number(req.params.amount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(401).json({ error: 'Amount must be a positive number' });
    }
    
    if (amount > 0.5) return res.status(401).json({ error: 'Airdrop amount must <= 0.5' });

    const requestPath = `/turnstile/v0/siteverify`;
    const body = {
      secret: secretKey,
      response: req.params.token,
    };

    const result = await axios.post(`${apiBaseUrl}${requestPath}`, body);

    if (result.data.success == false) return res.status(401).json({ error: 'You might be a robot' });

    const now = Date.now();
    if (now - lastTs > eightHoursTs) {
      lastTs = now;
      requestCounts = {};
    }
    const clientAddr = req.params.user;

    if (requestCounts[clientAddr] >= maxLimitPerAddr) {
      return res.status(429).send({ message: "To maintain adequate balances for all users, the Faucet distributes 0.5 Test SOL every 8 hours." });
    }
    
    const connection = new Connection('https://api.mainnet-beta.solana.com');
    try {
      const publicKey = new PublicKey(req.params.user);
      const balance = await connection.getBalance(publicKey);
      const solBalance = balance / 1e9;
      
      if (solBalance < 0.01) {
        return res.status(401).json({ error: 'You need at least 0.01 SOL in your wallet on Solana Mainnet to access the faucet.' });
      }
    } catch (error) {
      return res.status(401).json({ error: 'Unable to get mainnet wallet balance' });
    }

    const recipient = cmd.runSync([
      SOLANA_CLI_PATH,
      "transfer",
      req.params.user,
      req.params.amount,
      "--allow-unfunded-recipient",
      "--url localhost"
    ].join(" "));

    if (requestCounts[clientAddr]) {
      requestCounts[clientAddr]++;
    } else {
      requestCounts[clientAddr] = 1;
    }

    return res.status(200).json({ status: "ok", data: recipient });
  } catch (error: any) {
    return res.status(401).json({ error: error.toString() });
  }
};

const airdropWithApikey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body: any = req.body;

    // Add address validation
    if (!validateSolanaAddress(body.data.user)) {
      return res.status(401).json({ error: 'Invalid Solana address' });
    }

    // Add amount validation
    const amount = Number(body.data.amount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(401).json({ error: 'Amount must be a positive number' });
    }

    if (amount > 1) return res.status(401).json({ error: 'Airdrop amount must <= 1' });

    if (req.get('API-KEY') != '8c0f3d5b-9e47-4f1a-b8d6-2e9a7f8c4d1e') return res.status(401).json({ error: 'Invalid apikey' });

    const recipient = cmd.runSync([
      SOLANA_CLI_PATH,
      "transfer",
      body.data.user,
      body.data.amount,
      "--allow-unfunded-recipient",
      "--url localhost"
    ].join(" "));

    return res.status(200).json({ status: "ok", data: recipient });
  } catch (error: any) {
    return res.status(401).json({ error: error.toString() });
  }
};

const walletsCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const path = '.wallets';
    const wallets = fs.readFileSync(path).toString();

    res.status(200).json({ status: "ok", data: wallets });
  } catch (error: any) {
    res.status(401).json({ error: error.toString() });
  }
};

export default { airdrop, airdropWithApikey, walletsCount };
