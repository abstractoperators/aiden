import os
import json
from web3 import AsyncWeb3, AsyncHTTPProvider
from eth_account import Account

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
    with open("./src/bonding_token/artifacts/contracts/BondingCurveToken.sol/BondingCurveToken.json", "r") as f:
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
    deploy_txn = await contract.constructor(name, ticker).build_transaction({
        'from': deployer_address,
        'nonce': nonce,
        'gas': 5000000,
        'gasPrice': gas_price,
        'chainId': chain_id
    })

    # Sign and send deployment transaction
    signed_txn = w3.eth.account.sign_transaction(deploy_txn, PRIVATE_KEY)
    tx_hash = await w3.eth.send_raw_transaction(signed_txn.rawTransaction)
    print(f"Deployment TX sent: {tx_hash.hex()}")

    # Wait for deployment receipt
    receipt = await w3.eth.wait_for_transaction_receipt(tx_hash)
    contract_address = receipt.contractAddress
    print(f"Contract deployed at: {contract_address}")

    # Test buying a tiny amount (To remove in prod)
    buy_amount = w3.to_wei(0.01, "ether")  # Buying 0.01 SEI worth of tokens
    receipt = await buy_token(buy_amount, contract_address, contract_abi)
    print(receipt)
    
    return contract_address

async def buy_token(buy_amount, contract_address, contract_abi=None):
    w3 = AsyncWeb3(AsyncHTTPProvider(SEI_RPC_URL))
    # Check connection
    if not await w3.is_connected():
        raise ConnectionError("Failed to connect to Sei Network")
    
    if contract_abi is None:
        with open("./src/bonding_token/artifacts/contracts/BondingCurveToken.sol/BondingCurveToken.json", "r") as f:
            contract_json = json.load(f)
            contract_abi = contract_json["abi"]

    deployed_contract = w3.eth.contract(address=contract_address, abi=contract_abi)

    # Initialize account
    PRIVATE_KEY = os.getenv("TOKEN_DEPLOYER_PRIVATE_KEY")
    account = Account.from_key(PRIVATE_KEY)
    deployer_address = account.address

    # Prepare the transaction to buy tokens
    nonce = await w3.eth.get_transaction_count(deployer_address)
    gas_price = await w3.eth.gas_price
    chain_id = await w3.eth.chain_id

    buy_txn = {
        'to': contract_address,
        'value': buy_amount,
        'from': deployer_address,
        'nonce': nonce,
        'gas': 300000,
        'gasPrice': gas_price,
        'chainId': chain_id
    }

    signed_buy_txn = w3.eth.account.sign_transaction(buy_txn, PRIVATE_KEY)
    buy_tx_hash = await w3.eth.send_raw_transaction(signed_buy_txn.rawTransaction)
    print(f"Buy transaction sent: {buy_tx_hash.hex()}")

    buy_receipt = await w3.eth.wait_for_transaction_receipt(buy_tx_hash)
    print(f"Tokens bought successfully in tx: {buy_receipt.transactionHash.hex()}")
    return buy_receipt