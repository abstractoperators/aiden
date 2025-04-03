import { getToken } from "@/lib/api/token"
import { TokenLaunch } from "@/components/token";
import { BuyWithSei } from "@/components/token";
import { SellForSei, Balance } from "@/components/token";

export default async function Token({
    params,
}: {
    params: Promise<{ id: string }>,
}) {
    const id = (await params).id
    const token = await getToken(id)
    const { name, ticker, evmContractAddress: address } = token

    return (
        <main className="flex-1 self-stretch flex flex-col gap-8 m-8 bg-neutral-600/40 backdrop-blur p-8 rounded-xl">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                Tokens
            </h1>
            <TokenLaunch
                tokenName={name}
                tokenTicker={ticker}>
            </TokenLaunch>
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