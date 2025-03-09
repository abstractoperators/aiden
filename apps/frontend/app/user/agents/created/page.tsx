import CreatedAgentsTabs from "./tabs";

export default function CreatedAgentsDashboard() {
  return (
    <div className="m-8 sm:m-4 md:m-8 lg:m-16">
      <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl my-8">
        Created Agents
      </h1>
      <CreatedAgentsTabs />
    </div>
  )
}