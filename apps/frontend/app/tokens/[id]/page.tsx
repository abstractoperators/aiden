import { getToken } from "@/lib/api/token"
import { BuyWithSei } from "@/components/token";
import { SellForSei, Balance } from "@/components/token";
import { isErrorResult } from "@/lib/api/result";
import Link from "next/link";

export default async function TokenPage({
  params,
}: {
  params: Promise<{ id: string }>,
}) {
  const id = (await params).id
  const token = await getToken(id)
  if (isErrorResult(token)) {
    return (
      <main className="flex-1 self-stretch flex flex-col gap-8 m-8 bg-neutral-600/40 backdrop-blur p-8 rounded-xl">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
          Unable to retrieve Token information!
        </h1>
      </main>
    )
  }

  const { name, ticker, evmContractAddress: address } = token.data
  const seitrace_link = `https://seitrace.com/address/${address}?chain=atlantic-2`
  return (
    <main className="flex-1 self-stretch flex flex-col gap-8 m-8 bg-neutral-600/40 backdrop-blur p-8 rounded-xl">
      <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
        <Link href={seitrace_link} >
          {name}: ({ticker})
        </Link>
      </h1>
      <BuyWithSei
        tokenAddress={address}>
      </BuyWithSei>
      <SellForSei
        tokenAddress={address}>
      </SellForSei>
      <Balance
        tokenAddress={address}>
      </Balance>
    </main >
  )
}