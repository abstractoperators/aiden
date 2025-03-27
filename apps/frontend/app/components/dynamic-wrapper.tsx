'use client'

import { DynamicContextProvider, getAuthToken } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { CosmosWalletConnectors } from "@dynamic-labs/cosmos";
import { handleLogout } from "@/lib/auth-helpers";
import { getCsrfToken } from "next-auth/react";
import {
  dynamicToApiUser,
  getOrCreateUser,
  getUser,
  updateUser,
} from "@/lib/api/user";
import {
  createWallet,
  getWallet,
  Wallet as ApiWallet,
  updateWallet,
  deleteWallet,
  updateOrCreateWallet,
} from "@/lib/api/wallet";

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
          onAuthSuccess: async ({ user, primaryWallet }) => {
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

            // user initialization if needed
            const apiUser = await getOrCreateUser(await dynamicToApiUser(user))
            if (primaryWallet) {
              updateOrCreateWallet(
                { publicKey: primaryWallet.address },
                { ownerId: apiUser.id },
                {
                  publicKey: primaryWallet.address,
                  chain: primaryWallet.chain,
                  ownerId: apiUser.id,
                }
              )
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

            const apiUser = await getUser({ dynamicId: user.userId })

            createWallet({
              publicKey: jwtVerifiedCredential.address,
              chain: jwtVerifiedCredential.chain,
              ownerId: apiUser.id,
            })
          },
          onLogout: () => {
            handleLogout();
          },
          onUserProfileUpdate: async user => {
            const auth_token = getAuthToken()
            console.log("auth_token", auth_token)
            // fetch( "http://localhost:8003/auth/test", {
            //   method: "GET",
            //   headers: {
            //     Authorization: `Bearer ${auth_token}`,
            //   }});
            if (!user.userId)
              throw new Error(`User ${user} has no userId!`)
            const apiUser = await getUser({ dynamicId: user.userId }, { Authorization: `Bearer ${auth_token}` },)
            updateUser(apiUser.id, await dynamicToApiUser(user), { Authorization: `Bearer ${auth_token}` })
          },
          onWalletAdded: async ({ wallet, userWallets }) => {
            const user = await Promise.any(
              userWallets.map(
                dynamicWallet => getUser({ publicKey: dynamicWallet.address })
              )
            )

            // Cannot await auth on client >:(
            // https://stackoverflow.com/questions/78452233/error-headers-was-called-outside-a-request-scope
            // const session = await auth()
            // if (!session)
            //   throw new Error(`Session ${session} does not exist!`)
            // const user = session.user

            if (!user)
              throw new Error(`User ${user} does not exist!`)

            const apiWallet: ApiWallet | null = await getWallet({ publicKey: wallet.address }).catch(() => null)

            if (apiWallet) {
              updateWallet(apiWallet.id, { ownerId: user.id })
            } else {
              createWallet({
                publicKey: wallet.address,
                chain: wallet.chain,
                ownerId: user.id,
              })
            }
          },
          onWalletRemoved: ({ wallet }) => {
            getWallet({ publicKey: wallet.address })
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