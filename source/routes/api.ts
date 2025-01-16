/** source/routes/posts.ts */
import express, { NextFunction, Request, Response } from "express";
import sonic_ctl from "../controllers/api";
import cosmos from "../controllers/api.hssn";


const router = express.Router();

// import cmd from 'node-cmd';
const cmd = require('node-cmd');

const maxLimitPerIP = 1;
const oneDayTs = 1000 * 60 * 60 * 24;
let lastTs = 0;
let requestCounts: any = {};

const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const now = Date.now();
  if (now - lastTs > oneDayTs) {
    lastTs = now;
    requestCounts = {};
  }
  const clientIP = req.headers['x-real-ip'] as string;
  if (requestCounts[clientIP]) {
    requestCounts[clientIP]++;
  } else {
    requestCounts[clientIP] = 1;
  }
  if (requestCounts[clientIP] > maxLimitPerIP) {
    return res.status(429).send({ message: "Too many requests!" });
  }
  next();
};

router.get('/test', async (req: Request, res: Response, next: NextFunction) => {
  res.send("hello world");
})

if (process.env.USE_CONTROLLER == "sonic") {
  router.get('/airdrop/:user/:amount/:token', sonic_ctl.airdrop);
  router.get('/wallets-count', sonic_ctl.walletsCount);
  router.post('/airdrop', sonic_ctl.airdropWithApikey);
} else {
  router.get('/airdrop/:user/:amount/:token', cosmos.airdrop);
  router.get('/wallets-count', cosmos.walletsCount);
  router.post('/airdrop', cosmos.airdropWithApikey);
}



export default router;
