const { expect } = require("chai");
const UniswapV2Factory = require("@uniswap/v2-core/build/UniswapV2Factory.json");
const UniswapV2Router02 = require("@uniswap/v2-periphery/build/UniswapV2Router02.json");
const ERC20 = require("@uniswap/v2-core/build/ERC20.json");

const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");

describe("TugrikToken contract", function () {
  const usdtAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
  const uniswapV2FactoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
  const uniswapV2RouterAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const usdtHolderAddress = "0x5754284f345afc66a98fbb0a0afe71e0f007b949";
  const usdtSupply = ethers.utils.parseUnits("1", 6);

  async function deployTokenFixture() {
    const [owner] = await ethers.getSigners();

    const usdtToken = await ethers.getContractAt(ERC20.abi, usdtAddress);
    const usdtHolder = await ethers.getImpersonatedSigner(usdtHolderAddress);
    await usdtToken.connect(usdtHolder).transfer(owner.address, usdtSupply);

    const tugrikTokenFactory = await ethers.getContractFactory("TugrikToken");
    const tugrikToken = await tugrikTokenFactory.deploy();
    await tugrikToken.deployed();

    return { tugrikToken, usdtToken, owner };
  };

  describe("Deployment", function () {
    it("should assign TugrikToken the total supply of tokens to the owner", async function () {
      const { tugrikToken, owner } = await loadFixture(deployTokenFixture);
      const ownerBalance = await tugrikToken.balanceOf(owner.address);
      expect(await tugrikToken.totalSupply()).to.equal(ownerBalance);
    });

    it("should assign 1 USDT token to the owner", async function () {
      const { usdtToken, owner } = await loadFixture(deployTokenFixture);
      const ownerBalance = await usdtToken.balanceOf(owner.address);
      expect(usdtSupply).to.equal(ownerBalance);
    });
  });

  describe("Swap", function () {
    it("should exchange TugrikToken to USDT", async function () {
      const { tugrikToken, usdtToken, owner } = await loadFixture(deployTokenFixture);
      const block = await ethers.provider.getBlock(ethers.provider.getBlockNumber());
      const deadline = block.timestamp + 2 * 60 * 60;
      const showCurrectState = async stage => {
        const tugrikBalance = await tugrikToken.balanceOf(owner.address);
        const usdtBalance = await usdtToken.balanceOf(owner.address);

        console.log(`${stage}: ${tugrikBalance} MNT, ${usdtBalance} USDT`);
      };

      const tugrikTotalSupply = await tugrikToken.totalSupply();
      const tugrikLiquiditySupply = ethers.utils.parseUnits("5", 6);
      const tugrikForExchange = ethers.utils.parseUnits("3", 6);
      const minUsdtExchanged = ethers.utils.parseUnits("0.3", 6);

      const factory = await ethers.getContractAt(UniswapV2Factory.abi, uniswapV2FactoryAddress);
      await factory.createPair(usdtToken.address, tugrikToken.address);

      const router = await ethers.getContractAt(UniswapV2Router02.abi, uniswapV2RouterAddress);
      await tugrikToken.approve(router.address, tugrikLiquiditySupply);
      await usdtToken.approve(router.address, usdtSupply);

      await showCurrectState("Before liquidity added");

      await router.addLiquidity(
        tugrikToken.address,
        usdtToken.address,
        tugrikLiquiditySupply,
        usdtSupply,
        0,
        0,
        owner.address,
        deadline
      );

      await showCurrectState("Before exchange");

      await tugrikToken.approve(router.address, tugrikForExchange);
      await router.swapExactTokensForTokens(
        tugrikForExchange,
        minUsdtExchanged,
        [tugrikToken.address, usdtToken.address],
        owner.address,
        deadline
      );

      await showCurrectState("After exchange");

      const tugrikBalanceAfterExchange = await tugrikToken.balanceOf(owner.address);
      const usdtBalanceAfterExchange = await usdtToken.balanceOf(owner.address);
      expect(tugrikBalanceAfterExchange).to.equal(tugrikTotalSupply.sub(tugrikLiquiditySupply).sub(tugrikForExchange));
      expect(usdtBalanceAfterExchange).to.greaterThan(minUsdtExchanged);
    });
  });
});
