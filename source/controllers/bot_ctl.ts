import { NextFunction, Request, Response } from 'express';
import { Bot } from '../bot/bot';

const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body: any = req.body;
        console.log("bot body, ", body);
        // Add address validation
        let channel_token = body.channel_token;
        if (channel_token == null) {
            return res.status(401).json({ error: "channel_token should not be null" });
        }

        let message = body.message;
        if (message == null || message.trim() == "") {
            return res.status(401).json({ error: "message should not be null" });
        }

        return res.status(200).json({ status: "ok", data: await Bot.sendMessage(message, channel_token) });
    } catch (error: any) {
        return res.status(401).json({ error: error.toString() });
    }
};

export default { sendMessage };