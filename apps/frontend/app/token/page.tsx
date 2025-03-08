import { SendTransactionSection } from "@/components/token";
import {SellTokenSection} from "@/components/token";
import {GetTokenBalanceSection} from "@/components/token";

export default function TokenPage() {
  return (
    <div className="flex flex-col items-center w-full min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">Token Management</h1>
      <SendTransactionSection />
      <br />
      <SellTokenSection />
      <br />
      <GetTokenBalanceSection />
    </div>
  );
}