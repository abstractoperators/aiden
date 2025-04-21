import { TokenLaunch } from "@/components/token/launch";

export default async function TokensLaunchPage() {
  return (
    <main className="flex-1 self-stretch flex flex-col gap-8 m-8 bg-neutral-600/40 backdrop-blur p-8 rounded-xl">
      <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
        Tokens
      </h1>
      <TokenLaunch />
    </main >
  )
}
