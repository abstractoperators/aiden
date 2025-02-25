import json
import os

from eth_account import Account
from web3 import AsyncHTTPProvider, AsyncWeb3

SEI_RPC_URL = os.getenv("SEI_RPC_URL")  # Get the SEI EVM RPC URL


# Connects to SEI's EVM RPC and deploys a new instance of the token contract.
async def deploy_token(name, ticker):
    SEI_RPC_URL = os.getenv("SEI_RPC_URL")
    PRIVATE_KEY = os.getenv("TOKEN_DEPLOYER_PRIVATE_KEY")

    # Initialize async provider
    w3 = AsyncWeb3(AsyncHTTPProvider(SEI_RPC_URL))

    # Check connection
    if not await w3.is_connected():
        raise ConnectionError("Failed to connect to Sei Network")

    # Load ABI and bytecode
    with open(
        "./src/bonding_token/artifacts/contracts/BondingCurveToken.sol/BondingCurveToken.json",
        "r",
    ) as f:
        contract_json = json.load(f)
    contract_abi = contract_json["abi"]
    contract_bytecode = contract_json["bytecode"]

    # Initialize account
    account = Account.from_key(PRIVATE_KEY)
    deployer_address = account.address

    # Deploy contract
    contract = w3.eth.contract(abi=contract_abi, bytecode=contract_bytecode)

    nonce = await w3.eth.get_transaction_count(deployer_address)
    gas_price = await w3.eth.gas_price
    chain_id = await w3.eth.chain_id
    # Build transaction with the given name and ticker
    deploy_txn = await contract.constructor(name, ticker).build_transaction(
        {
            "from": deployer_address,
            "nonce": nonce,
            "gas": 5000000,
            "gasPrice": gas_price,
            "chainId": chain_id,
        }
    )

    # Sign and send deployment transaction
    signed_txn = w3.eth.account.sign_transaction(deploy_txn, PRIVATE_KEY)
    tx_hash = await w3.eth.send_raw_transaction(signed_txn.raw_transaction)
    print(f"Deployment TX sent: {tx_hash.hex()}")

    # Wait for deployment receipt
    receipt = await w3.eth.wait_for_transaction_receipt(tx_hash)
    contract_address = receipt.contractAddress
    print(f"Contract deployed at: {contract_address}")

    # Test buying a tiny amount (To remove in prod)
    buy_amount = w3.to_wei(0.01, "ether")  # Buying 0.01 SEI worth of tokens
    receipt = await buy_token(buy_amount, contract_address)
    print(receipt)

    return contract_address, contract_abi


async def buy_token(buy_amount, contract_address):
    w3 = AsyncWeb3(AsyncHTTPProvider(SEI_RPC_URL))
    # Check connection
    if not await w3.is_connected():
        raise ConnectionError("Failed to connect to Sei Network")

    # Initialize account
    PRIVATE_KEY = os.getenv("TOKEN_DEPLOYER_PRIVATE_KEY")
    account = Account.from_key(PRIVATE_KEY)
    deployer_address = account.address

    # Prepare the transaction to buy tokens
    nonce = await w3.eth.get_transaction_count(deployer_address)
    gas_price = await w3.eth.gas_price
    chain_id = await w3.eth.chain_id

    buy_txn = {
        "to": contract_address,
        "value": buy_amount,
        "from": deployer_address,
        "nonce": nonce,
        "gas": 300000,
        "gasPrice": gas_price,
        "chainId": chain_id,
    }

    signed_buy_txn = w3.eth.account.sign_transaction(buy_txn, PRIVATE_KEY)
    buy_tx_hash = await w3.eth.send_raw_transaction(signed_buy_txn.raw_transaction)
    print(f"Buy transaction sent: {buy_tx_hash.hex()}")

    buy_receipt = await w3.eth.wait_for_transaction_receipt(buy_tx_hash)
    print(f"Tokens bought successfully in tx: {buy_receipt.transactionHash.hex()}")
    return buy_receipt


async def sell_token_unsigned(amount, contract_abi, contract_address, user_address):
    """
    Returns an unsigned transaction to sell tokens.

    amount: Amount of tokens to sell

    contract_address: Address of the token contract

    user_address: Address of the user selling the tokens
    """
    w3 = AsyncWeb3(AsyncHTTPProvider(SEI_RPC_URL))
    if not await w3.is_connected():
        raise ConnectionError("Failed to connect to Sei Network")

    contract = w3.eth.contract(address=contract_address, abi=contract_abi)

    nonce = await w3.eth.get_transaction_count(user_address)
    gas_price = await w3.eth.gas_price
    chain_id = await w3.eth.chain_id

    sell_function_data = contract.encodeABI(fn_name="sellTokens", args=[amount])

    unsigned_txn = {
        "from": user_address,
        "to": contract_address,
        "value": 0,  # Selling tokens, not sending SEI/eth
        "gas": 300000,
        "gasPrice": gas_price,
        "nonce": nonce,
        "data": sell_function_data,
        "chainId": chain_id,
    }
    return unsigned_txn


async def buy_token_unsigned(amount, contract_address, user_address):
    """
    Returns an unsigned transaction to buy tokens.

    amount: Amount of tokens to buy

    contract_abi: ABI of the token contract

    contract_address: Address of the token contract

    user_address: Address of the user buying the tokens
    """
    w3 = AsyncWeb3(AsyncHTTPProvider(SEI_RPC_URL))
    if not await w3.is_connected():
        raise ConnectionError("Failed to connect to Sei Network")

    nonce = await w3.eth.get_transaction_count(user_address)
    gas_price = await w3.eth.gas_price
    chain_id = await w3.eth.chain_id

    unsigned_buy_txn = {
        "to": contract_address,
        "value": amount,  # Amount in SEI
        "from": user_address,
        "nonce": nonce,
        "gas": 300000,
        "gasPrice": gas_price,
        "chainId": chain_id,
    }

    return unsigned_buy_txn
