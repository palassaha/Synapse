import { CronJob } from 'cron';
import http from 'node:http';
import https from 'node:https';
import dotenv from 'dotenv';

dotenv.config();

const cronJobs = new CronJob("*/14 * * * *", function () {

    const base = process.env.FRONTEND_URL;
    if (!base) return;
    const url = new URL("/health", base).href;
    const client = url.startsWith("https") ? https : http;

    client.get(url, (res) => {
        if (res.statusCode === 200) {
            console.log("Health check successful");
        } else {
            console.log(`Health check failed with status code: ${res.statusCode}`);
        }
    }).on('error', (err) => {
        console.error(`Health check request failed: ${err.message}`);
    });
});

export default cronJobs;