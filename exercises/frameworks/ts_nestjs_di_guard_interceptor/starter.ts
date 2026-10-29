// Tightly-Coupled Controller with Inline Auth & Duplicated Logging
export class BillingController {
  async issueRefund(req: any) {
    if (!req.user || req.user.role !== "FINANCE_ADMIN") {
      throw new Error("Forbidden");
    }
    const start = Date.now();
    const res = { refundedId: req.body.invoiceId, by: req.user.id };
    console.log("took", Date.now() - start);
    return res;
  }
}
