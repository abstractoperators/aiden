import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { CosmosWalletConnectors } from "@dynamic-labs/cosmos";
import { onAuthSuccess } from "@/lib/authHelpersClient";

export default function DynamicProviderWrapper({ children }: React.PropsWithChildren) {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID ?? "",
        walletConnectors: [
          CosmosWalletConnectors,
          EthereumWalletConnectors,
        ],
        events: {
          onAuthSuccess: onAuthSuccess,
        },
      }}
    >
      {children}
    </DynamicContextProvider>
  );
}