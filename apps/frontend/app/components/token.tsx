"use client";
import { formatUnits } from "viem";
import { useState, FormEventHandler, FC, useEffect } from "react";
import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { parseEther, formatEther } from "viem";
// import { ApiToken } from "@/lib/agent";
import { Token } from "@/lib/api/token";

const BuyTokenSection: FC<{ token: Token }> = ({ token }) => {
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
    console.log(token.evm_contract_address);
    const transaction = {
      to: token.evm_contract_address,
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

const SellTokenSection: FC<{ token: Token }> = ({ token }) => {
  const { primaryWallet } = useDynamicContext();
  const [txnHash, setTxnHash] = useState("");

  const onSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const amountWei = formData.get("amount") as string;
    console.log(amountWei);
    const amountWeiBigInt = BigInt(amountWei);
    console.log(amountWeiBigInt);
    const amountEth = amountWeiBigInt / BigInt(10 ** 18);
    console.log(amountEth);
    if (!primaryWallet || !isEthereumWallet(primaryWallet)) return;

    const walletClient = await primaryWallet.getWalletClient();
    const publicClient = await primaryWallet.getPublicClient();
    if (!walletClient) return;

    console.log(amountEth);

    const hash = await walletClient.writeContract({
      address: token.evm_contract_address,
      abi: token.abi,
      functionName: "sellTokens",
      args: [BigInt("1")],
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

const GetTokenBalanceSection: FC<{ token: Token }> = ({ token }) => {
  const { primaryWallet } = useDynamicContext();
  const [balance, setBalance] = useState("");

  useEffect(() => {
    const fetchBalance = async () => {
      if (!primaryWallet || !isEthereumWallet(primaryWallet)) return;

      const publicClient = await primaryWallet.getPublicClient();
      const address = primaryWallet.address;

      const tokenBalance = await publicClient.readContract({
        address: token.evm_contract_address,
        abi: token.abi,
        functionName: "balanceOf",
        args: [address],
      });

      setBalance(tokenBalance);
    };

    fetchBalance();
  }, [primaryWallet, token]);

  if (!primaryWallet || !isEthereumWallet(primaryWallet)) return null;

  return (
    <div>
      <p>Token Balance (wei): {balance}</p>
    </div>
  );
};

/**
 * This section shows the current price of the token.
 * It shows 1 SEI = x Token, as well as 1 Token = x SEI.
 */
const GetTokenPriceSection: FC<{ token: Token }> = ({ token }) => {
  const { primaryWallet } = useDynamicContext();
  const [price, setPrice] = useState("");

  useEffect(() => {
    const fetchPrice = async () => {
      if (!primaryWallet || !isEthereumWallet(primaryWallet)) return;

      const publicClient = await primaryWallet.getPublicClient();
      const address = primaryWallet.address;

      const tokenSupply = await publicClient.readContract({
        address: token.evm_contract_address,
        abi: token.abi,
        functionName: "totalSupply",
      });

      const one_sei = parseEther("1");

      const tokenPrice = await publicClient.readContract({
        address: token.evm_contract_address,
        abi: token.abi,
        functionName: "calculateTokensForSEI",
        args: [one_sei, tokenSupply],
      });

      setPrice(tokenPrice);
    };

    fetchPrice();
  }, [primaryWallet, token]);

  if (!primaryWallet || !isEthereumWallet(primaryWallet)) return null;

  return (
    <div>
      <p>Token Price (1 SEI : Wei ){price}</p>
    </div>
  );
};

export {
  BuyTokenSection,
  SellTokenSection,
  GetTokenBalanceSection,
  GetTokenPriceSection,
};
