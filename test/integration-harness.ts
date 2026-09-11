import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import { AmpecoApiError, AmpecoClient } from "../src/index.js";

const requests: Array<{ method?: string; url?: string; body: string; authorization?: string }> = [];
const server = createServer(async (request, response) => {
  let body = "";
  for await (const chunk of request) body += chunk;
  requests.push({ method: request.method, url: request.url, body, authorization: request.headers.authorization });
  if (request.url?.startsWith("/public-api/resources/charge-points/v2.0/42")) {
    response.writeHead(200, { "content-type": "application/json" });
    response.end('{"data":{"id":42,"name":"CP-1"}}');
    return;
  }
  if (request.url?.startsWith("/public-api/actions/charge-point/v1.0/42/start/5")) {
    response.writeHead(202); response.end(); return;
  }
  response.writeHead(404, { "content-type": "application/json" }); response.end('{"message":"not found"}');
});
server.listen(0, "127.0.0.1");
await once(server, "listening");
const address = server.address();
if (!address || typeof address === "string") throw new Error("Could not start local HTTP harness.");

try {
  const client = new AmpecoClient({ tenantUrl: `http://127.0.0.1:${address.port}`, apiKey: "harness-token" });
  const point = await client.chargePoints.get(42);
  assert.equal(point.name, "CP-1");
  await client.chargePoints.startCharging(42, 5, { userId: 7 });
  assert.equal(requests[0]?.authorization, "Bearer harness-token");
  assert.equal(requests[1]?.body, '{"userId":7}');
  await assert.rejects(() => client.chargePoints.get(404), (error: unknown) => error instanceof AmpecoApiError && error.status === 404);
  console.log("All local HTTP integration-harness checks passed.");
} finally {
  server.close();
  await once(server, "close");
}
