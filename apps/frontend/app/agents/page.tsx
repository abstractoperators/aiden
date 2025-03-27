import AgentsTabs from "./tabs";

export default function AgentsDashboard() {
  return (
    <main className="w-5/6 flex-1 flex flex-col gap-8 m-8 sm:m-4 md:m-8 lg:m-16 bg-neutral-600/40 backdrop-blur p-4 rounded-xl">
      <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
        Agents
      </h1>
      {/* TODO: improve font colors on datatable */}
      <AgentsTabs />
    </main>
  )
}