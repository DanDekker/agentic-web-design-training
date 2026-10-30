// Express 5 payment webhook: verify raw bytes and persist before acknowledging.
// Interfaces are injected so this exercise runs without Express or a payment SDK.
export interface WebhookRequest {
  body: unknown;
  get(name: string): string | undefined;
}
export interface WebhookResponse {
  status(code: number): this;
  json(body: unknown): this;
  sendStatus(code: number): this;
}
export type WebhookHandler = (req: WebhookRequest, res: WebhookResponse) => unknown;
export interface WebhookApp {
  post(path: string, parser: unknown, handler: WebhookHandler): unknown;
  use(parser: unknown): unknown;
}
export interface BodyParsers {
  raw(options: { type: string; limit: number; inflate: boolean }): unknown;
  json(options: { limit: number; inflate: boolean }): unknown;
}
export interface VerifiedEvent { id: string; type: string; data: unknown }
export interface WebhookServices {
  // A provider SDK adapter returns null for an invalid signature or malformed event;
  // unexpected failures reject. It must verify the timestamp and the original bytes.
  verify(raw: Uint8Array, signature: string): Promise<VerifiedEvent | null>;
  // In production, a durable unique event ID and outbox insert share one transaction.
  // Concurrent or later duplicate deliveries commit no second outbox entry.
  recordAndEnqueue(event: VerifiedEvent): Promise<void>;
}

export function registerPaymentWebhook(app: WebhookApp, express: BodyParsers, services: WebhookServices): void {
  app.post(
    "/webhooks/payments",
    express.raw({ type: "application/json", limit: 65536, inflate: false }),
    async (req, res) => {
      const signature = req.get("stripe-signature");
      if (!(req.body instanceof Uint8Array) || !signature) {
        return res.status(400).json({ error: "Invalid webhook" });
      }
      const event = await services.verify(req.body, signature);
      if (!event || typeof event.id !== "string" || !/^evt_[A-Za-z0-9]{1,100}$/.test(event.id) || typeof event.type !== "string") {
        return res.status(400).json({ error: "Invalid webhook" });
      }
      if (event.type === "payment_intent.succeeded") {
        await services.recordAndEnqueue(event);
      }
      // Only acknowledge after the durable transaction; workers still need idempotent effects.
      return res.sendStatus(204);
    },
  );
  // Install general JSON parsing only after the raw-body webhook route.
  app.use(express.json({ limit: 65536, inflate: false }));
}
