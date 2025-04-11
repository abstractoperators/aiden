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
  User,
} from "@/lib/api/user";
import {
  createWallet,
  getWallet,
  updateWallet,
  deleteWallet,
  updateOrCreateWallet,
  Wallet,
} from "@/lib/api/wallet";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { isErrorResult, isSuccessResult, Result } from "@/lib/api/result";

export default function DynamicProvider({ children }: React.PropsWithChildren) {
  const router = useRouter()

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

            router.refresh();
            // user initialization if needed
            const userResult = await getOrCreateUser(await dynamicToApiUser(user))
            if (isSuccessResult<User>(userResult)) {
              const validUser = userResult.data
              if (primaryWallet) {
                updateOrCreateWallet(
                  { publicKey: primaryWallet.address },
                  { ownerId: validUser.id },
                  {
                    publicKey: primaryWallet.address,
                    chain: primaryWallet.chain,
                    ownerId: validUser.id,
                  }
                )
              }
            } else {
              toast({
                title: "Login error!",
                description: userResult.message,
              })
            }

            router.refresh()
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

            const { address, chain } = jwtVerifiedCredential

            const apiUser = await getUser({ dynamicId: user.userId })
            if (isSuccessResult(apiUser)) {
              createWallet({
                publicKey: address,
                chain,
                ownerId: apiUser.data.id,
              })
            } else {
              toast({
                title: "User not found",
                description: `Unable to find AIDN user matching user ID ${user.userId} and attach wallet ${address} on chain ${chain}.`,
              })
            }
          },
          onLogout: () => {
            handleLogout();
          },
          onUserProfileUpdate: async user => {
            if (!user.userId)
              throw new Error(`User ${user} has no userId!`)
            const apiUser = await getUser({ dynamicId: user.userId })
            if (isSuccessResult<User>(apiUser)) {
              updateUser(apiUser.data.id, await dynamicToApiUser(user))
            } else {
              toast({
                title: "User not found",
                description: "Unable to update AIDN user profile.",
              })
            }

          },
          onWalletAdded: async ({ wallet, userWallets }) => {
            const user: Result<User> = await Promise.any(userWallets.map(dynamicWallet => (
              getUser({ publicKey: dynamicWallet.address, chain: dynamicWallet.chain })
                .then(result => (isSuccessResult<User>(result) ? result : Promise.reject(result)))
            ))).catch(reason => {
              if (reason instanceof AggregateError) {
                return reason.errors[0] as Result<User>
              } else {
                throw reason
              }
            })

            // Cannot await auth on client >:(
            // https://stackoverflow.com/questions/78452233/error-headers-was-called-outside-a-request-scope
            // const session = await auth()
            // if (!session)
            //   throw new Error(`Session ${session} does not exist!`)
            // const user = session.user

            if (isErrorResult(user)) {
              toast({
                title: "Unable to add wallet to AIDN user",
                description: user.message,
              })
              return
            }

            const apiWallet = await (
              getWallet({ publicKey: wallet.address, chain: wallet.chain })
            )

            if (isSuccessResult<Wallet>(apiWallet)) {
              updateWallet(apiWallet.data.id, { ownerId: user.data.id })
            } else {
              createWallet({
                publicKey: wallet.address,
                chain: wallet.chain,
                ownerId: user.data.id,
              })
            }
          },
          onWalletRemoved: async ({ wallet }) => {
            const walletResult = await getWallet({ publicKey: wallet.address, chain: wallet.chain })

            if (isSuccessResult<Wallet>(walletResult)) {
              deleteWallet(walletResult.data.id)
            } else {
              toast({ // do nothing if it doesn't exist.
                title: "Unable to Remove Wallet",
                description: walletResult.message,
              })
            }
          },
          // NOTE: by these implementations of onWalletAdded and onWalletRemoved,
          // wallet transfers in Dynamic will manifest as destruction and recreation of the same wallet in the API.
        },
      }}
    >
      {children}
    </DynamicContextProvider>
  );
}