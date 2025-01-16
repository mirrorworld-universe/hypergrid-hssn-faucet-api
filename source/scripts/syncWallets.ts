import axios from "axios";
import fs from 'fs';
import schedule from 'node-schedule';

const apiBaseUrl = "http://localhost:8899";

async function syncWallets() {
  try {
    const path = '.wallets';
    let startTime = Date.now();

    const body = {
      jsonrpc: "2.0",
      id: 1,
      method: "getWalletCount",
      params: [
        "11111111111111111111111111111111",
        {
          encoding: "base64",
          filters: [
          ]
        }
      ]
    };

    const result = await axios.post(`${apiBaseUrl}`, body, { headers: { "Content-Type": "application/json" } });

    if (result.data.result) {
      console.log(`Response is OK and took ${(Date.now() - startTime) / 1000} seconds`);
      console.log(`[Wallets Sync Succeed] Total ${result.data.result} wallets\n`);
      fs.writeFileSync(path, String(result.data.result));
    } else {
      console.warn(`[Wallets Sync Failed] Response is NOT OK and took ${(Date.now() - startTime) / 1000} seconds`);
    }
  } catch (e) {
    console.log(`[Wallets Sync Failed] ${e}`);
  }
}

schedule.scheduleJob({ hour: 16, minute: 0, second: 0 }, async () => {
  if (process.env.USE_CONTROLLER != 'sonic') {
    console.log("skip syncWallets for non sonic controller")
    return;
  }
  console.log('Wallets Sync Start @', new Date().toLocaleString('chinese', { hour12: false }));
  await syncWallets();
  console.log('Wallets Sync Done @', new Date().toLocaleString('chinese', { hour12: false }));
  console.log();
});