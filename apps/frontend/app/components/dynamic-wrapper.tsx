'use client'

import { DynamicContextProvider, getAuthToken } from "@dynamic-labs/sdk-react-core";
import { CosmosWalletConnectors } from "@dynamic-labs/cosmos";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { getCsrfToken } from "next-auth/react";
import { handleLogout } from "@/lib/authHelpers";
// import { createUser, dynamicToApiUser } from "@/lib/api/user";

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
          onAuthSuccess: async (args) => {
            if (args.user.newUser) {
              // await createUser(dynamicToApiUser(
              //   args.primaryWallet,
              //   args.primaryWallet, // TODO get a sei address
              //   args.user,
              // );
            }
            const authToken = getAuthToken();

            if (!authToken) {
              console.error("No auth token found");
              return
            }

            const csrfToken = await getCsrfToken();

            if (csrfToken === undefined || authToken === undefined)
              throw Error("Csrf Token or Auth Token undefined")

            fetch("/api/auth/callback/credentials", {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: `csrfToken=${encodeURIComponent(
                csrfToken
              )}&token=${encodeURIComponent(
                authToken
              )}`,
            })
            .then((res) => {
              if (res.ok) {
                console.log('LOGGED IN', res);
                // Handle success - maybe redirect to the home page or user dashboard
              } else {
                // Handle any errors - maybe show an error message to the user
                console.error("Failed to log in");
              }
            })
            .catch((error) => {
              // Handle any exceptions
              console.error("Error logging in", error);
            });
          },
          onLogout: async () => {
            await handleLogout();
          },
        },
      }}
    >
      {children}
    </DynamicContextProvider>
  );
}