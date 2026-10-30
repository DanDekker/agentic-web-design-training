async function verifyDigitalCredentialAtOrigin(
  credential,
  {
    fetchImpl,
    endpoint = "/api/credentials/verify",
    origin,
  } = {},
) {
  if (!credential || typeof credential.protocol !== "string" || !credential.data || typeof credential.data !== "object") {
    throw new TypeError("credential must contain a protocol and response data");
  }
  if (typeof fetchImpl !== "function" || typeof origin !== "string") {
    throw new TypeError("fetchImpl and origin are required");
  }

  const base = new URL(origin);
  if (base.protocol !== "https:") throw new TypeError("credential verification requires HTTPS");
  const target = new URL(endpoint, base);
  if (target.origin !== base.origin || target.username || target.password) {
    throw new TypeError("credential verification endpoint must be same-origin");
  }

  const body = JSON.stringify({ protocol: credential.protocol, data: credential.data });
  const response = await fetchImpl(target.href, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    credentials: "same-origin",
    cache: "no-store",
    redirect: "error",
  });
  if (!response || !response.ok) return false;
  const result = await response.json();
  return result?.verified === true;
}
