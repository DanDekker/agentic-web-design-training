// Legacy Pages Router Sequential Blocking getServerSideProps Waterfall
export async function getServerSideProps(context: any) {
  const user = await fetchUser(context.params.id);
  const org = await fetchOrg(user.orgId); // Sequential waterfall!
  const metrics = await fetchMetrics(context.params.id); // Waits for org first!
  return { props: { user, org, metrics } };
}
