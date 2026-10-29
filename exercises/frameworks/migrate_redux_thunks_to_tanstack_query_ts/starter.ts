// Legacy Redux Boilerplate with Duplicate Concurrent Fetches & No Stale Time
export function legacyUsersReducer(state = { loading: false, data: null, error: null }, action: any) {
  switch (action.type) {
    case "FETCH_REQUEST": return { ...state, loading: true };
    case "FETCH_SUCCESS": return { loading: false, data: action.payload, error: null };
    case "FETCH_FAILURE": return { loading: false, data: null, error: action.error };
    default: return state;
  }
}
