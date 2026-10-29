// Leaky Nested RxJS Subscriptions & Stale Account Race Condition
export class PortfolioService {
  selectedAccountId = "acc_1";
  positions: any[] = [];
  totalValuation = 0;

  selectAccount(accountId: string, fetchPositions: (id: string) => Promise<any[]>) {
    this.selectedAccountId = accountId;
    // Race condition: slow previous account response overwrites newer account!
    fetchPositions(accountId).then((rows) => {
      this.positions = rows;
      this.totalValuation = rows.reduce((s, r) => s + r.marketValue, 0);
    });
  }
}
