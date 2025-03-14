'use client'

import { DynamicContextProvider, getAuthToken, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { CosmosWalletConnectors } from "@dynamic-labs/cosmos";
import { handleLogout } from "@/lib/authHelpers";
import { getCsrfToken } from "next-auth/react";
import { createUser, dynamicToApiUser, getUser, updateUser } from "@/lib/api/user";
import { createWallet, getWallet, Wallet as ApiWallet, updateWallet, deleteWallet } from "@/lib/api/wallet";

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
          onAuthSuccess: async ({ user }) => {
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

            // new user initialization
            if (user.newUser) {
              createUser(dynamicToApiUser(user))
            }
          },
          onEmbeddedWalletCreated: async (jwtVerifiedCredential, user) => {
            if (!user)
              throw new Error(`User ${user} does not exist!`)
            if (!user.userId)
              throw new Error(`User ${user} has no userId!`)

            if (!jwtVerifiedCredential)
              throw new Error(`JWT Credential ${jwtVerifiedCredential} for Embedded Wallet belong to ${user} does not exist!`)
            if (!jwtVerifiedCredential.address)
              throw new Error(`JWT Credential ${jwtVerifiedCredential} has no address!`)

            const apiUser = await getUser({ dynamic_id: user.userId })

            createWallet({
              public_key: jwtVerifiedCredential.address,
              chain: jwtVerifiedCredential.chain,
              owner_id: apiUser.id,
            })
          },
          onLogout: () => {
            handleLogout();
          },
          onUserProfileUpdate: async (user) => {
            if (!user.userId)
              throw new Error(`User ${user} has no userId!`)
            const apiUser = await getUser({ dynamic_id: user.userId })
            updateUser(apiUser.id, dynamicToApiUser(user))
          },
          onWalletAdded: async ({ wallet }) => {
            const { user } = useDynamicContext() // TODO: get the user another way, invalid hook call.
            if (!user)
              throw new Error(`User ${user} does not exist!`)
            if (!user.userId)
              throw new Error(`User ${user} has no userId!`)
            const apiUser = await getUser({ dynamic_id: user.userId })

            const apiWallet: ApiWallet | null = await getWallet({ public_key: wallet.address }).catch(() => null)
            if (apiWallet) {
              updateWallet(apiWallet.id, { owner_id: apiUser.id })
            } else {
              createWallet({
                public_key: wallet.address,
                chain: wallet.chain,
                owner_id: apiUser.id,
              })
            }
          },
          onWalletRemoved: ({ wallet }) => {
            getWallet({ public_key: wallet.address })
            .then(apiWallet => deleteWallet(apiWallet.id))
            .catch(() => {
              // do nothing if it doesn't exist.
              console.log("Wallet", wallet, "does not exist on API")
            })
          }
          // NOTE: by these implementations of onWalletAdded and onWalletRemoved,
          // wallet transfers in Dynamic will manifest as destruction and recreation of the same wallet in the API.
        },
      }}
    >
      {children}
    </DynamicContextProvider>
  );
}