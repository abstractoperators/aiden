import { BuyTokenSection } from "@/components/token";
import { SellTokenSection } from "@/components/token";
import { GetTokenBalanceSection } from "@/components/token";
import { getToken } from "@/lib/agent";

export default async function TokenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const token_id = (await params).id;
  const token = await getToken(token_id);
  return (
    <div className="flex flex-col items-center w-full min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">Token Management</h1>
      <BuyTokenSection token={token}></BuyTokenSection>
      <br />
      {/*     <SellTokenSection token={token}></SellTokenSection>
      <br /> */}
      <GetTokenBalanceSection token={token}></GetTokenBalanceSection>
    </div>
  );
}
