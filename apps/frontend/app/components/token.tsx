"use client";
import { useState, FormEventHandler, FC, useEffect } from "react";
import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { parseEther, formatEther } from "viem";

const CONTRACT_ADDRESS = "0x27513df8A4D34130cC8c9d6686060AAB347a9ba6";

const CONTRACT_ABI = [
{
    inputs: [
    {
        internalType: "string",
        name: "name",
        type: "string",
    },
    {
        internalType: "string",
        name: "symbol",
        type: "string",
    },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
},
{
    anonymous: false,
    inputs: [
    {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
    },
    {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
    },
    {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
    },
    ],
    name: "Approval",
    type: "event",
},
{
    anonymous: false,
    inputs: [
    {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
    },
    {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
    },
    {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
    },
    ],
    name: "Transfer",
    type: "event",
},
{
    inputs: [
    {
        internalType: "address",
        name: "owner",
        type: "address",
    },
    {
        internalType: "address",
        name: "spender",
        type: "address",
    },
    ],
    name: "allowance",
    outputs: [
    {
        internalType: "uint256",
        name: "",
        type: "uint256",
    },
    ],
    stateMutability: "view",
    type: "function",
},
{
    inputs: [
    {
        internalType: "address",
        name: "spender",
        type: "address",
    },
    {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
    },
    ],
    name: "approve",
    outputs: [
    {
        internalType: "bool",
        name: "",
        type: "bool",
    },
    ],
    stateMutability: "nonpayable",
    type: "function",
},
{
    inputs: [
    {
        internalType: "address",
        name: "account",
        type: "address",
    },
    ],
    name: "balanceOf",
    outputs: [
    {
        internalType: "uint256",
        name: "",
        type: "uint256",
    },
    ],
    stateMutability: "view",
    type: "function",
},
{
    inputs: [],
    name: "buyTokens",
    outputs: [],
    stateMutability: "payable",
    type: "function",
},
{
    inputs: [
    {
        internalType: "uint256",
        name: "tokenAmount",
        type: "uint256",
    },
    {
        internalType: "uint256",
        name: "supply",
        type: "uint256",
    },
    ],
    name: "calculateSEIForTokens",
    outputs: [
    {
        internalType: "uint256",
        name: "",
        type: "uint256",
    },
    ],
    stateMutability: "pure",
    type: "function",
},
{
    inputs: [
    {
        internalType: "uint256",
        name: "ethAmount",
        type: "uint256",
    },
    {
        internalType: "uint256",
        name: "supply",
        type: "uint256",
    },
    ],
    name: "calculateTokensForSEI",
    outputs: [
    {
        internalType: "uint256",
        name: "",
        type: "uint256",
    },
    ],
    stateMutability: "pure",
    type: "function",
},
{
    inputs: [],
    name: "decimals",
    outputs: [
    {
        internalType: "uint8",
        name: "",
        type: "uint8",
    },
    ],
    stateMutability: "view",
    type: "function",
},
{
    inputs: [
    {
        internalType: "address",
        name: "spender",
        type: "address",
    },
    {
        internalType: "uint256",
        name: "subtractedValue",
        type: "uint256",
    },
    ],
    name: "decreaseAllowance",
    outputs: [
    {
        internalType: "bool",
        name: "",
        type: "bool",
    },
    ],
    stateMutability: "nonpayable",
    type: "function",
},
{
    inputs: [],
    name: "getCurrentPrice",
    outputs: [
    {
        internalType: "uint256",
        name: "",
        type: "uint256",
    },
    ],
    stateMutability: "view",
    type: "function",
},
{
    inputs: [
    {
        internalType: "address",
        name: "spender",
        type: "address",
    },
    {
        internalType: "uint256",
        name: "addedValue",
        type: "uint256",
    },
    ],
    name: "increaseAllowance",
    outputs: [
    {
        internalType: "bool",
        name: "",
        type: "bool",
    },
    ],
    stateMutability: "nonpayable",
    type: "function",
},
{
    inputs: [],
    name: "k",
    outputs: [
    {
        internalType: "uint256",
        name: "",
        type: "uint256",
    },
    ],
    stateMutability: "view",
    type: "function",
},
{
    inputs: [],
    name: "name",
    outputs: [
    {
        internalType: "string",
        name: "",
        type: "string",
    },
    ],
    stateMutability: "view",
    type: "function",
},
{
    inputs: [],
    name: "reserveBalance",
    outputs: [
    {
        internalType: "uint256",
        name: "",
        type: "uint256",
    },
    ],
    stateMutability: "view",
    type: "function",
},
{
    inputs: [
    {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
    },
    ],
    name: "sellTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
},
{
    inputs: [],
    name: "symbol",
    outputs: [
    {
        internalType: "string",
        name: "",
        type: "string",
    },
    ],
    stateMutability: "view",
    type: "function",
},
{
    inputs: [],
    name: "totalSupply",
    outputs: [
    {
        internalType: "uint256",
        name: "",
        type: "uint256",
    },
    ],
    stateMutability: "view",
    type: "function",
},
{
    inputs: [
    {
        internalType: "address",
        name: "to",
        type: "address",
    },
    {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
    },
    ],
    name: "transfer",
    outputs: [
    {
        internalType: "bool",
        name: "",
        type: "bool",
    },
    ],
    stateMutability: "nonpayable",
    type: "function",
},
{
    inputs: [
    {
        internalType: "address",
        name: "from",
        type: "address",
    },
    {
        internalType: "address",
        name: "to",
        type: "address",
    },
    {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
    },
    ],
    name: "transferFrom",
    outputs: [
    {
        internalType: "bool",
        name: "",
        type: "bool",
    },
    ],
    stateMutability: "nonpayable",
    type: "function",
},
{
    stateMutability: "payable",
    type: "receive",
},
];
export const SendTransactionSection: FC = () => {
  const { primaryWallet } = useDynamicContext();
  const [txnHash, setTxnHash] = useState("");
  if (!primaryWallet || !isEthereumWallet(primaryWallet)) return null;
  const onSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    // const address = formData.get("address") as string;
    // const address = "0x27513df8A4D34130cC8c9d6686060AAB347a9ba6";
    const amount = formData.get("amount") as string;

    const publicClient = await primaryWallet.getPublicClient();
    const walletClient = await primaryWallet.getWalletClient();

    const transaction = {
      to: CONTRACT_ADDRESS,
      value: amount ? parseEther(amount) : undefined,
    };
    const chainId = await walletClient.getChainId();
    console.log(`chainId: ${chainId}`);
    const hash = await walletClient.sendTransaction(transaction);
    setTxnHash(hash);

    const receipt = await publicClient.waitForTransactionReceipt(hash);
    console.log(receipt);
  };
  return (
    <form onSubmit={onSubmit}>
      <p>Send to ETH address</p>
      <input name="address" type="text" required placeholder="Address" />
      <input name="amount" type="text" required placeholder="0.05" />
      <button type="submit">Send</button>
      <span data-testid="transaction-section-result-hash">{txnHash}</span>
    </form>
  );
};

export const SellTokenSection: FC = () => {
  const { primaryWallet } = useDynamicContext();
  const [txnHash, setTxnHash] = useState("");

  if (!primaryWallet || !isEthereumWallet(primaryWallet)) return null;

  const onSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const amount = formData.get("amount") as string;

    const walletClient = await primaryWallet.getWalletClient();

    // Call sellTokens function
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "sellTokens",
      args: [parseEther(amount)],
    });

    setTxnHash(hash);
  };

  return (
    <form onSubmit={onSubmit}>
      <p>Sell Tokens</p>
      <input name="amount" type="text" required placeholder="Amount" />
      <button type="submit">Sell</button>
      <span>{txnHash}</span>
    </form>
  );
};

export const GetTokenBalanceSection: FC = () => {
    const { primaryWallet } = useDynamicContext();
  const [balance, setBalance] = useState("");
  
  useEffect(() => {
    const fetchBalance = async () => {
      if (!primaryWallet || !isEthereumWallet(primaryWallet)) return;
      
      const publicClient = await primaryWallet.getPublicClient();
      const address = primaryWallet.address;
      
      const tokenBalance = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'balanceOf',
        args: [address]
      });
      
      setBalance(formatEther(tokenBalance));
    };
    
    fetchBalance();
  }, [primaryWallet]);
  
  if (!primaryWallet || !isEthereumWallet(primaryWallet)) return null;
  
  return (
    <div>
      <p>Token Balance: {balance}</p>
    </div>
  );
}
