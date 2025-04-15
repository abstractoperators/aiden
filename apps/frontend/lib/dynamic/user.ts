import { UserProfile, Wallet } from "@dynamic-labs/sdk-react-core";

function getDisplayName(user: UserProfile, wallet: Wallet) {
  return user.username || user.email || wallet.address
}

export {
  getDisplayName,
}