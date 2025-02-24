import Header from "@/components/header";
import AgentsTabs from "./tabs";
import Footer from "@/components/footer";

export default function AgentsDashboard() {
  return (
    <div className="flex flex-col items-center w-full min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col gap-8 m-8 sm:m-4 md:m-8 lg:m-16">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
          Agents
        </h1>
        <AgentsTabs />
      </main>
      <Footer />
    </div>
  )
}