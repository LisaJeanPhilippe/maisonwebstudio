// Local Cloudflare API stand-in for the end-to-end test (port 8792). Never contacts Cloudflare.
import http from "node:http";
import { createCloudflareMock } from "../cloudflare-mock.mjs";

const mock = createCloudflareMock({ token: process.env.MOCK_CF_TOKEN, accountId: process.env.MOCK_CF_ACCOUNT });
http
  .createServer(async (req, res) => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const request = new Request(`http://127.0.0.1:8792${req.url}`, { method: req.method, headers: req.headers, body: req.method === "GET" || req.method === "HEAD" ? undefined : body, duplex: "half" });
    try {
      const out = await mock.handle(request);
      res.writeHead(out.status, Object.fromEntries(out.headers));
      res.end(Buffer.from(await out.arrayBuffer()));
    } catch (e) {
      res.writeHead(500, { "content-type": "text/plain" });
      res.end(String(e));
    }
  })
  .listen(8792, "127.0.0.1");
