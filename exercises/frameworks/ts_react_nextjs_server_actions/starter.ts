// Untyped React Client Mutation with Broken Optimistic Rollback
export async function submitOrderAction(rawInput: any): Promise<any> {
  // No runtime validation or discriminated union error envelope
  const saved = await saveOrderToDb(rawInput);
  return saved;
}

export function optimisticOrdersReducer(state: any[], action: any) {
  state.push(action.payload); // Mutates state in place and cannot roll back on server failure!
  return state;
}
