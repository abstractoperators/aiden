import AgentsTabs from "./tabs";

export default function AgentsDashboard() {
  return (
    <main className="flex-1 flex flex-col gap-8 m-8 sm:m-4 md:m-8 lg:m-16">
      <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
        Agents
      </h1>
      <AgentsTabs />
    </main>
  )
}