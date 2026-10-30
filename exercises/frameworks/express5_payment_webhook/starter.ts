// The global JSON parser destroys the signed bytes and the handler acknowledges
// before work is safely recorded. Repair the ordering and delivery semantics.
export interface WebhookRequest { body: unknown; get(name: string): string | undefined }
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
  verify(raw: Uint8Array, signature: string): Promise<VerifiedEvent | null>;
  recordAndEnqueue(event: VerifiedEvent): Promise<void>;
}

export function registerPaymentWebhook(app: WebhookApp, express: BodyParsers, services: WebhookServices): void {
  app.use(express.json({ limit: 65536, inflate: true }));
  app.post("/webhooks/payments", express.raw({ type: "application/json", limit: 65536, inflate: true }), async (_req, res) => {
    return res.sendStatus(204);
  });
}
