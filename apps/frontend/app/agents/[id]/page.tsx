// https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes
import Chat from "@/components/chat";
import { getAgent } from "@/lib/agent";
import Link from "next/link";
export default async function AgentHome({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  const agent = await getAgent(id);
  if (!agent.runtime)
    console.log(`Agent ${agent.character_json.name} has no runtime!`);

  const token = agent.token;
  const token_id = agent.token_id;

  const token_ticker = token?.ticker;
  console.log(`Agent ${agent.character_json.name} has token ${token_ticker}`);

  console.log(`token: ${token}.${agent.token_id}`);
  return (
    <main className="flex-1 flex flex-col w-5/6 justify-start items-center gap-8 m-8 sm:m-4 md:m-8 lg:m-16">
      <div className="flex items-center">
        {token_id ? (
          <Link
            href={`/token/${token_id}`}
            className="mr-6 flex items-center space-x-2"
          >
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
              {`${agent.character_json.name} ($${token_ticker})`}
            </h1>
          </Link>
        ) : (
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
            {agent.character_json.name}
          </h1>
        )}
      </div>

      {agent.runtime && agent.eliza_agent_id ? (
        <Chat elizaId={agent.eliza_agent_id} runtimeUrl={agent.runtime.url} />
      ) : (
        <p>This agent has no chat.</p>
      )}
    </main>
  );
}
