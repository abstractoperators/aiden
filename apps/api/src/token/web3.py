import json
from web3 import Web3
from eth_account import Account

SEI_RPC_URL = os.getenv("SEI_RPC_URL")  # Get the SEI EVM RPC URL

# Connects to SEI's EVM RPC and deploys a new instance of the token contract.
def deploy_token(name, ticker):
    w3 = Web3(Web3.HTTPProvider(SEI_RPC_URL))

    # Check connection
    if not w3.is_connected():
        raise ConnectionError("Failed to connect to Sei Network")

    # Load ABI and bytecode
    with open("bondingToken.json") as f:
        contract_json = json.load(f)
    contract_abi = contract_json["abi"]
    contract_bytecode = contract_json["bytecode"]

    # The deployer is currently a prviate key managed by the team.
    # Ensure that this wallet has enough funds to supply gas for the deployment operations.
    PRIVATE_KEY = os.getenv("TOKEN_DEPLOYER_PRIVATE_KEY") 
    account = Account.from_key(PRIVATE_KEY)
    deployer_address = account.address

    # Deploy contract
    contract = w3.eth.contract(abi=contract_abi, bytecode=contract_bytecode)

    # Build transaction. Pass in the name and ticker here
    deploy_txn = contract.constructor(name, ticker).build_transaction({
        'from': deployer_address,
        'nonce': w3.eth.get_transaction_count(deployer_address),
        'gas': 5_000_000,
        'gasPrice': w3.eth.gas_price,
        'chainId': w3.eth.chain_id
    })

    # Sign and send deployment transaction
    signed_txn = w3.eth.account.sign_transaction(deploy_txn, PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
    print(f"Deployment TX sent: {tx_hash.hex()}")

    # Wait for deployment
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    contract_address = receipt.contractAddress
    print(f"Contract deployed at: {contract_address}")
    return contract_address
