import { WebClient } from '@slack/web-api';
import { assert_is_not_empty } from './util';


class BotService {
    private slack: WebClient;
    constructor() {
        assert_is_not_empty(process.env.COMMON_BOT_SLACK_TOKEN, "slack token is not set");
        this.slack = new WebClient(process.env.COMMON_BOT_SLACK_TOKEN)
    }
    public async sendMessage(message: string, slack_channel: string) {
        assert_is_not_empty(slack_channel, "slack_channel is not set");
        assert_is_not_empty(message, "message is not set");
        let res = await this.slack.chat.postMessage({
            channel: slack_channel,
            text: message
        })
        return res
    }
}

export const Bot = new BotService();

export default BotService;

