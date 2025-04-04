import { config as dotEnvConfig } from 'dotenv';
dotEnvConfig();

import { Connection, Keypair, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import axios from "axios";
import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
// import cmd from 'node-cmd';
const cmd = require('node-cmd');

const apiBaseUrl = "https://challenges.cloudflare.com";
const secretKey = process.env.SECRETKEY as string;
const SOLANA_CLI_PATH = "/home/ubuntu/.local/share/solana/install/active_release/bin/solana";
const ID_LOCATION = "/home/ubuntu/.config/solana/id.json"




const maxLimitPerAddr = 3;
const eightHoursTs = 1000 * 60 * 60 * 8;
let lastTs = 0;
let requestCounts: any = {};


// for script airdrop 

const scriptMaxLimitPerAddr = 5;
const scriptEightHoursTs = 1000 * 60 * 60 * 8;
let scriptLastTs = 0;
let sciprtRequestCounts: any = {};

// Add helper function
const validateSolanaAddress = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
}


let get_keypair = (): Keypair => {
  let kp = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(ID_LOCATION).toString())))

  return kp;
}

let transfer_sol = async (address: string, amount: number): Promise<string> => {
  console.log("start transfer sol")
  let id_kp = get_keypair()
  let toPubkey = new PublicKey(address)
  let lamports = Math.floor(amount * 1e9);
  console.log("after gen lamports");
  let ix = SystemProgram.transfer({
    fromPubkey: id_kp.publicKey,
    toPubkey,
    lamports
  });
  console.log("after gen transaction")

  let connection = new Connection("http://localhost:8899")
  let msgV0 = new TransactionMessage({
    payerKey: id_kp.publicKey,
    instructions: [ix],
    recentBlockhash: (await connection.getLatestBlockhash()).blockhash
  }).compileToV0Message();
  let tx = new VersionedTransaction(msgV0)
  tx.sign([id_kp])
  let sig = connection.sendTransaction(tx)
  // const sig = await sendAndConfirmTransaction(connection, transaction, [id_kp])

  return sig;
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

    if (amount > 5) return res.status(401).json({ error: 'Airdrop amount must <= 5' });

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
      return res.status(429).send({ message: "To maintain adequate balances for all users, the Faucet distributes 5 Test SOL every 8 hours." });
    }

    /*
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
    */


    // const recipient = cmd.runSync([
    //   SOLANA_CLI_PATH,
    //   "transfer",
    //   req.params.user,
    //   req.params.amount,
    //   "--allow-unfunded-recipient",
    //   "--url localhost"
    // ].join(" "));

    let recipient = await transfer_sol(req.params.user, amount)

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
    console.log("sonic body, ", body);
    // Add address validation
    let user = body.data.user;
    if (user == null) {
      return res.status(401).json({ error: "user should not be null" });
    }
    if (!validateSolanaAddress(user)) {
      return res.status(401).json({ error: 'Invalid Solana address' });
    }

    // Add amount validation
    console.log("start number amount")
    const amount = Number(body.data.amount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(401).json({ error: 'Amount must be a positive number' });
    }
    console.log("end number amount");

    if (amount > 5) return res.status(401).json({ error: 'Airdrop amount must <= 5' });

    if (req.get('API-KEY') != process.env.SONIC_API_KEY) return res.status(401).json({ error: 'Invalid apikey' });

    // const recipient = cmd.runSync([
    //   SOLANA_CLI_PATH,
    //   "transfer",
    //   body.data.user,
    //   body.data.amount,
    //   "--allow-unfunded-recipient",
    //   "--url localhost"
    // ].join(" "));

    let recipient = await transfer_sol(user, amount)

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



export default {airdrop, airdropWithApikey, walletsCount };
