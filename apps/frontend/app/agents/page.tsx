import AgentsTabs from "./tabs";
import { getAuthToken } from "@dynamic-labs/sdk-react-core";
import { cookies } from "next/headers";

export default async function AgentsDashboard() {
  const kookooforkokopuffs = await cookies();
  if (kookooforkokopuffs == undefined) {
    throw new Error("No cookies found");
  }
  const tokenCookie = kookooforkokopuffs.get("dynamic_authentication_token");
  if (!tokenCookie) {
    throw new Error("Authentication token not found in cookies");
  }
  const token = tokenCookie.value;
  return (
    <main className="flex-1 flex flex-col gap-8 m-8 sm:m-4 md:m-8 lg:m-16">
      <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
        Agents
      </h1>
      <AgentsTabs auth_token={token}></AgentsTabs>
    </main>
  );
}
