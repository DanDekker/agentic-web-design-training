// Unvalidated Loose RPC Handler Map
export const appRouter = {
  createProject: async (ctx: any, input: any) => {
    // Forgot to check ctx.user or validate input.name length!
    return { id: "prj_1", name: input.name, ownerId: ctx.user.id };
  }
};
