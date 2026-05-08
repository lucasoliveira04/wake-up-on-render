import "dotenv/config";
import * as https from "https";
import * as http from "http";
import type { IncomingMessage, ClientRequest } from "http";

const siteUrl = process.env.SITE_URL;
const timeoutMs = Number(process.env.TIMEOUT_MS) || 60_000;

if (!siteUrl) {
  throw new Error("SITE_URL nao foi definida. Configure no arquivo .env.");
}

const SITE_URL: string = siteUrl;

interface PingResult {
  success: boolean;
  statusCode?: number;
  durationMs?: number;
  error?: string;
}

function ping(url: string): Promise<PingResult> {
  const start = Date.now();
  const client = url.startsWith("https") ? https : http;

  return new Promise((resolve) => {
    const req: ClientRequest = client.get(
      url,
      { timeout: timeoutMs },
      (res: IncomingMessage) => {
        const durationMs = Date.now() - start;
        const timestamp = new Date().toISOString();
        console.log(
          `[${timestamp}] Ping OK status ${res.statusCode} (${durationMs}ms) -> ${url}`,
        );
        res.resume();
        resolve({ success: true, statusCode: res.statusCode, durationMs });
      },
    );

    req.on("error", (e: Error) => {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] Falha no ping: ${e.message} -> ${url}`);
      resolve({ success: false, error: e.message });
    });

    req.on("timeout", () => {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] Timeout ao pingar -> ${url}`);
      req.destroy();
      resolve({ success: false, error: "timeout" });
    });
  });
}

async function main(): Promise<void> {
  console.log(`MakeUpOnProject iniciado`);
  console.log(`Alvo: ${SITE_URL}`);
  console.log(`${new Date().toISOString()}\n`);

  const result = await ping(SITE_URL);
  process.exit(result.success ? 0 : 1);
}

main();
