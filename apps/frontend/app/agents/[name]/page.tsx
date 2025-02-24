// https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes

import Chat from "@/components/chat"
import Footer from "@/components/footer"
import Header from "@/components/header"

// export async function generateStaticParams() {}

export default async function AgentHome({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const { name } = await params

  return (
    <div className="flex flex-col items-center w-full min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col w-5/6 justify-start items-center gap-8 m-8 sm:m-4 md:m-8 lg:m-16">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
          {name}
        </h1>
        <Chat />
      </main>
      <Footer />
    </div>
  )
}