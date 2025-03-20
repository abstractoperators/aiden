import CreationForm from "./form";

export default function AgentCreation() {
  return (
    <div className="my-16 mx-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl my-8">
        Create an Agent
      </h1>
      <CreationForm />
    </div>
  )
}