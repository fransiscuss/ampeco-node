import { describe, expect, it, vi } from "vitest";
import { AmpecoApiError, AmpecoClient, ValueSets } from "../src/index.js";

describe("AmpecoClient", () => {
  it("normalizes a tenant URL, sends Bearer auth, and unwraps data", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response('{"data":{"id":42,"name":"CP-1","status":"enabled"}}', { status: 200 }));
    const client = new AmpecoClient({ tenantUrl: "mytenant.ampeco.com/", apiKey: "test-token", fetch });

    await expect(client.chargePoints.get(42)).resolves.toMatchObject({ id: 42, name: "CP-1" });
    const [url, init] = fetch.mock.calls[0] ?? [];
    expect(String(url)).toBe("https://mytenant.ampeco.com/public-api/resources/charge-points/v2.0/42");
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer test-token");
  });

  it("serializes deep-object filters and opts in to cursor pagination", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response('{"data":[],"meta":{"per_page":25}}', { status: 200 }));
    const client = new AmpecoClient({ tenantUrl: "https://example.test", apiKey: "token", fetch });

    await client.sessions.getPage({ userId: 123, startedAfter: new Date("2024-01-01T00:00:00.000Z") }, undefined, { perPage: 25 });
    const url = String(fetch.mock.calls[0]?.[0]);
    expect(url).toContain("filter%5BuserId%5D=123");
    expect(url).toContain("filter%5BstartedAfter%5D=2024-01-01T00%3A00%3A00Z");
    expect(url).toContain("cursor=");
    expect(url).toContain("per_page=25");
  });

  it("follows cursor pages while streaming", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(new Response('{"data":[{"id":"s1","status":"active"}],"meta":{"next_cursor":"CUR2"}}', { status: 200 }))
      .mockResolvedValueOnce(new Response('{"data":[{"id":"s2","status":"finished"}],"meta":{}}', { status: 200 }));
    const client = new AmpecoClient({ tenantUrl: "https://example.test", apiKey: "token", fetch });
    const ids: string[] = [];
    for await (const session of client.sessions.stream()) ids.push(session.id ?? "");

    expect(ids).toEqual(["s1", "s2"]);
    expect(String(fetch.mock.calls[0]?.[0])).toContain("cursor=");
    expect(String(fetch.mock.calls[1]?.[0])).toContain("cursor=CUR2");
  });

  it("keeps API validation errors inspectable", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response('{"message":"The given data was invalid.","errors":{"name":["The name field is required."]}}', { status: 422 }));
    const client = new AmpecoClient({ tenantUrl: "https://example.test", apiKey: "token", fetch });

    await expect(client.chargePoints.create({ type: ValueSets.ChargePointType.Public })).rejects.toMatchObject({
      status: 422,
      errors: { name: ["The name field is required."] },
    });
  });

  it("posts a start command and accepts an empty 202 response", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response("", { status: 202 }));
    const client = new AmpecoClient({ tenantUrl: "https://example.test", apiKey: "token", fetch });

    await client.chargePoints.startCharging(5, 2, { userId: 77, stopConditions: { maxEnergyKwh: 20 } });
    const [url, init] = fetch.mock.calls[0] ?? [];
    expect(String(url)).toContain("/actions/charge-point/v1.0/5/start/2");
    expect(init?.body).toBe('{"userId":77,"stopConditions":{"maxEnergyKwh":20}}');
  });
});
