// TypeScript React 19 / Next.js Safe Server Action & Rollback-Capable Optimistic Reducer
export type ActionResult<TData, TField extends string = string> =
  | { readonly ok: true; readonly data: TData; readonly revalidatedTags: readonly string[] }
  | { readonly ok: false; readonly code: "VALIDATION_ERROR" | "SERVER_ERROR"; readonly message: string; readonly fieldErrors?: Partial<Record<TField, string>> };

export interface OrderItem {
  readonly id: string;
  readonly sku: string;
  readonly amountCents: number;
  readonly pending?: boolean;
}

export type OptimisticAction =
  | { readonly type: "OPTIMISTIC_ADD"; readonly tempId: string; readonly sku: string; readonly amountCents: number }
  | { readonly type: "COMMIT_SUCCESS"; readonly tempId: string; readonly committed: OrderItem }
  | { readonly type: "ROLLBACK_FAILURE"; readonly tempId: string };

export function optimisticOrdersReducer(
  state: readonly OrderItem[],
  action: OptimisticAction,
): OrderItem[] {
  switch (action.type) {
    case "OPTIMISTIC_ADD":
      return [
        ...state,
        { id: action.tempId, sku: action.sku, amountCents: action.amountCents, pending: true },
      ];
    case "COMMIT_SUCCESS":
      return state.map((item) =>
        item.id === action.tempId ? { ...action.committed, pending: false } : item,
      );
    case "ROLLBACK_FAILURE":
      return state.filter((item) => item.id !== action.tempId);
  }
}

export function createSafeServerAction<TInput extends Record<string, unknown>, TOutput>(config: {
  readonly validate: (raw: Record<string, unknown>) => { valid: true; value: TInput } | { valid: false; fieldErrors: Record<string, string> };
  readonly revalidateTags: readonly string[];
  readonly handler: (input: TInput) => Promise<TOutput>;
}) {
  return async (rawInput: Record<string, unknown>): Promise<ActionResult<TOutput>> => {
    const parsed = config.validate(rawInput);
    if (!parsed.valid) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        message: "Invalid action payload",
        fieldErrors: parsed.fieldErrors,
      };
    }
    try {
      const data = await config.handler(parsed.value);
      return {
        ok: true,
        data,
        revalidatedTags: [...config.revalidateTags],
      };
    } catch (err) {
      return {
        ok: false,
        code: "SERVER_ERROR",
        message: err instanceof Error ? err.message : "Action execution failed",
      };
    }
  };
}
