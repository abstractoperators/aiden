# Bonding Token Contract

This subdirectory contains a hardhat project that builds the bonding-token contract.
Since it uses hardhat, it uses npm to track dependencies.

## Bonding Token Contract
The Bonding Token Contract describes an ERC20 token that sells tokens to buyers, priced on a bonding curve.

In it's current iteration, the bonding curve is a simple linear relationship y = kx where y is the price, x is the total minted supply and k is an arbitrary coefficient.
The price of n tokens is the area under the graph from `x1` to `x1+n`
![alt text](linar_bonding_curve.png)

## Compiling the contract

After making changes to the contract in `./contracts/BondingCurveToken.sol`, run `npx hardhat compile` from this directory. Alternatively, you can run `make build-token-contract` from the root of the AIDEN repo.

## Unit tests

This contract comes with unit tests in `./tests/BondingCurveToken.sol`. To run the tests, run `npx hardhat test`from this directory. Alternatively, you can run `make test-token-contract` from the root of the AIDEN repo.
