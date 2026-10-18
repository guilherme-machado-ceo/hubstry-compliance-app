import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./safe-fetch.js", () => ({
  safeFetchText: vi.fn(),
}));

import { safeFetchText } from "./safe-fetch.js";
import { scanUrl } from "./scanner.js";

describe("scanUrl", () => {
  beforeEach(() => {
    vi.mocked(safeFetchText).mockReset();
  });

  it("busca via safeFetchText e devolve um ScanResult", async () => {
    vi.mocked(safeFetchText).mockResolvedValue(
      '<html lang="pt-BR"><body><a href="/privacidade">Privacidade</a></body></html>',
    );

    const result = await scanUrl("https://example.com/");

    expect(safeFetchText).toHaveBeenCalledWith("https://example.com/");
    expect(Array.isArray(result.violations)).toBe(true);
    expect(typeof result.complianceScore).toBe("number");
    expect(result.summary).toEqual(
      expect.objectContaining({
        critical: expect.any(Number),
        warning: expect.any(Number),
        info: expect.any(Number),
      }),
    );
  });

  it("propaga o erro de destino bloqueado sem escanear", async () => {
    vi.mocked(safeFetchText).mockRejectedValue(
      Object.assign(new Error("URL aponta para endereco nao permitido"), {
        code: "BLOCKED_ADDRESS",
      }),
    );

    await expect(scanUrl("http://127.0.0.1/")).rejects.toMatchObject({
      code: "BLOCKED_ADDRESS",
    });
  });
});
