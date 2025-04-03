import { TokenLaunch } from "@/components/token";
import { BuyWithSei } from "@/components/token";

export default function TokensDashboard() {
    return (
        <main className="flex-1 self-stretch flex flex-col gap-8 m-8 bg-neutral-600/40 backdrop-blur p-8 rounded-xl">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                Tokens
            </h1>
            <TokenLaunch
                tokenName="foo"
                tokenTicker="bar" >
            </TokenLaunch>
            <BuyWithSei
                tokenAddress="0x889AF18DbBeE2e37F085d8916f7F0Aa79B8f1944">
            </BuyWithSei>
        </main>
    )
}