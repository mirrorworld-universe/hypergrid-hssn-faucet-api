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




const maxLimitPerAddr = 5;
const eightHoursTs = 1000 * 60 * 60 * 8;
let lastTs = 0;
let requestCounts: any = {};



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


const scriptAirdrop = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Add address validation
    if (!validateSolanaAddress(req.params.user)) {
      return res.status(401).json({ error: 'Invalid Solana address' });
    }

    // Add amount validation 
    const amount = Number(req.params.lamports);
    if(isNaN(amount)) {
      return res.status(401).json({ error: 'lamports not a number' });
    }
    if (amount <= 0) {
      return res.status(401).json({ error: 'Amount must be a positive number' });
    }

    if(Math.floor(amount)!=amount) {
      return res.status(401).json({ error: 'Amount is not a lamports number. float number do not allowed.' });
    }


    if (amount > 5*10**9) return res.status(401).json({ error: 'Airdrop amount must <= 5 sols' });



    const now = Date.now();
    if (now - lastTs > eightHoursTs) {
      lastTs = now;
      requestCounts = {};
    }
    const clientAddr = req.params.user;

    if (requestCounts[clientAddr] >= maxLimitPerAddr) {
      return res.status(429).send({ message: "To maintain adequate balances for all users, the Faucet distributes 5 Test SOL every 8 hours." });
    }



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


export default {scriptAirdrop};
