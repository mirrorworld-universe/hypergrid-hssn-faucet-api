/** source/routes/posts.ts */
import express from "express";
import { Request, Response, NextFunction } from 'express';
import controller from "../controllers/api";

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

router.get('/airdrop/:user/:amount/:token', controller.airdrop);
router.get('/wallets-count', controller.walletsCount);
router.post('/airdrop', controller.airdropWithApikey);

export = router;
