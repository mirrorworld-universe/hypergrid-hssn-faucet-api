import { config as dotEnvConfig } from 'dotenv';
dotEnvConfig();

import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import axios from "axios";

// import cmd from 'node-cmd';
const cmd = require('node-cmd');

const apiBaseUrl = "https://challenges.cloudflare.com";
const secretKey = process.env.SECRETKEY as string;
const COSMOS_CLI_PATH = "/home/ubuntu/.hypergrid-ssn/bin/hypergrid-ssnd";

const maxLimitPerAddr = 1;
const eightHoursTs = 1000 * 60 * 60 * 8;
let lastTs = 0;
let requestCounts: any = {};

const validateCosmosAddress = (address: string): boolean => {
  return /^[a-zA-Z0-9]{39,59}$/.test(address);
}

const validateAmount = (amount: any): boolean => {
  const num = Number(amount);
  return !isNaN(num) && num > 0 && num <= 1;
}

const airdrop = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!validateCosmosAddress(req.params.user)) {
      return res.status(400).json({ error: 'Invalid cosmos address format' });
    }
    if (!validateAmount(req.params.amount)) {
      return res.status(400).json({ error: 'Amount must be a number between 0 and 1' });
    }

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
      return res.status(429).send({ message: "To maintain adequate balances for all users, the Faucet distributes 1 Test hSOL every 8 hours." });
    }

    const recipient = cmd.runSync([
      COSMOS_CLI_PATH,
      "tx bank send my_validator",
      req.params.user,
      `${req.params.amount}hsol`,
      "--chain-id hypergridssn",
      "--keyring-backend test -y"
    ].join(" "));

    if (requestCounts[clientAddr]) {
      requestCounts[clientAddr]++;
    } else {
      requestCounts[clientAddr] = 1;
    }

    return res.status(200).json({ status: "ok", data: {} });
  } catch (error: any) {
    return res.status(401).json({ error: 'An error occurred while processing your request' });
  }
};

const airdropWithApikey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body: any = req.body;

    if (req.get('API-KEY') != 'bec50c3a-ea09-42c2-a242-1dacbe90ce33') return res.status(401).json({ error: 'Invalid apikey' });

    if (!validateCosmosAddress(body.data.user)) {
      return res.status(400).json({ error: 'Invalid cosmos address format' });
    }
    if (!validateAmount(body.data.amount)) {
      return res.status(400).json({ error: 'Amount must be a number between 0 and 1' });
    }

    const recipient = cmd.runSync([
      COSMOS_CLI_PATH,
      "tx bank send my_validator",
      body.data.user,
      `${body.data.amount}hsol`,
      "--chain-id hypergridssn",
      "--keyring-backend test -y"
    ].join(" "));

    return res.status(200).json({ status: "ok", data: {} });
  } catch (error: any) {
    return res.status(401).json({ error: 'An error occurred while processing your request' });
  }
};

const walletsCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const path = '.wallets';
    const wallets = fs.readFileSync(path).toString();

    res.status(200).json({ status: "ok", data: wallets });
  } catch (error: any) {
    res.status(401).json({ error: 'An error occurred while processing your request' });
  }
};

export default { airdrop, airdropWithApikey, walletsCount };
