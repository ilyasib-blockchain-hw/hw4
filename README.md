# Blockchain ITMO HW4 Project

## Run tests

  1) Add environment variable `ALCHEMY_API_KEY`
  2) Run `npm install`
  3) Run `npx hardhat test`

## Output example

```
  TugrikToken contract
    Deployment
      ✔ should assign TugrikToken the total supply of tokens to the owner (4483ms)
      ✔ should assign 1 USDT token to the owner
    Swap
Before liquidity added: 1000000000000000000 MNT, 1000000 USDT
Before exchange: 999999999995000000 MNT, 0 USDT
After exchange: 999999999992000000 MNT, 374296 USDT
      ✔ should exchange TugrikToken to USDT (2389ms)
```
