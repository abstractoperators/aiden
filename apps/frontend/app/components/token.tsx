"use client";
import { useState, FormEventHandler, FC, useEffect } from "react";
import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { parseEther, formatEther } from "viem";
import { ApiToken } from "@/lib/agent";

const BuyTokenSection: FC<{ token: ApiToken }> = ({ token }) => {
  const { primaryWallet } = useDynamicContext();
  const [txnHash, setTxnHash] = useState("");

  // Moving the conditional rendering to the return statement instead of early return
  const onSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    if (!primaryWallet || !isEthereumWallet(primaryWallet)) return;

    const formData = new FormData(event.currentTarget);
    const amount = formData.get("amount") as string;
    const publicClient = await primaryWallet.getPublicClient();
    const walletClient = await primaryWallet.getWalletClient();
    console.log(token.contract_address);
    const transaction = {
      to: token.contract_address,
      value: amount ? parseEther(amount) : undefined,
    };
    const chainId = await walletClient.getChainId();
    console.log(`chainId: ${chainId}`);
    const hash = await walletClient.sendTransaction(transaction);
    setTxnHash(hash);
    const receipt = await publicClient.waitForTransactionReceipt(hash);
  };

  // Conditional rendering in the return statement
  if (!primaryWallet || !isEthereumWallet(primaryWallet)) {
    return null;
  }

  return (
    <form onSubmit={onSubmit}>
      <p> Buy {token.ticker} </p>
      <input name="amount" type="text" required placeholder="Amount SEI" />
      <button type="submit">Send</button>
      <br />
      <span data-test-id="transaction-section-result-hash">
        Transaction Hash: {txnHash}
      </span>
    </form>
  );
};

const SellTokenSection: FC<{ token: ApiToken }> = ({ token }) => {
  const { primaryWallet } = useDynamicContext();
  const [txnHash, setTxnHash] = useState("");

  const onSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const amount = formData.get("amount") as string;

    if (!primaryWallet || !isEthereumWallet(primaryWallet)) return;

    const walletClient = await primaryWallet.getWalletClient();
    console.log(walletClient);
    if (!walletClient) return;

    // Call sellTokens function
    const hash = await walletClient.writeContract({
      address: token.contract_address,
      abi: token.contract_abi,
      functionName: "sellTokens",
      args: [parseEther(amount)],
    });

    setTxnHash(hash);
  };
  if (!primaryWallet || !isEthereumWallet(primaryWallet)) return null;

  return (
    <form onSubmit={onSubmit}>
      <p>Sell Tokens</p>
      <input name="amount" type="text" required placeholder="Amount" />
      <button type="submit">Sell</button>
      <span>{txnHash}</span>
    </form>
  );
};

const GetTokenBalanceSection: FC<{ token: ApiToken }> = ({ token }) => {
  const { primaryWallet } = useDynamicContext();
  const [balance, setBalance] = useState("");

  useEffect(() => {
    const fetchBalance = async () => {
      if (!primaryWallet || !isEthereumWallet(primaryWallet)) return;

      if (!token || !token.contract_address || !token.contract_abi) {
        console.error("Token data is incomplete:", token);
        setError("Token data is missing");
        return;
      }
      const publicClient = await primaryWallet.getPublicClient();
      const address = primaryWallet.address;

      const tokenBalance = await publicClient.readContract({
        address: token.contract_address,
        abi: token.contract_abi,
        functionName: "balanceOf",
        args: [address],
      });

      setBalance(formatEther(tokenBalance));
    };

    fetchBalance();
  }, [primaryWallet, token]);

  if (!primaryWallet || !isEthereumWallet(primaryWallet)) return null;

  return (
    <div>
      <p>Token Balance: {balance}</p>
    </div>
  );
};
export { BuyTokenSection, SellTokenSection, GetTokenBalanceSection };
