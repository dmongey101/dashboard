const dotenv = require('dotenv')
const ethers = require('ethers')
const ProtofiMasterChefABI = require('./abis/ProtofiMasterChef.json')
const ERC20ABI = require('./abis/ERC20.json')
const MoneyPotABI = require('./abis/MoneyPot.json')

dotenv.config()

const provider = new ethers.providers.JsonRpcProvider('https://rpc.ftm.tools/')
let wallet = ethers.Wallet.fromMnemonic(process.env.PROTO_MNEMONIC);
wallet = wallet.connect(provider);

const main = async () => {
    try {
        const ProtofiMasterChefContract = new ethers.Contract("0xa71f52aee8311c22b6329EF7715A5B8aBF1c6588", ProtofiMasterChefABI.abi, provider)
        const ElctronTokenContract = new ethers.Contract('0x622265EaB66A45FA05bAc9B8d2262AA548FA449E', ERC20ABI.abi, provider)
        const signer = ProtofiMasterChefContract.connect(wallet);
        let gasPrice = await getGasPrice(provider)
        let tx = await signer.deposit(3, 0, { gasPrice, })
        await tx.wait()
        console.log(tx)
        sleep(10)
        let elctBalance = await ElctronTokenContract.balanceOf('0x74FA51504961725f560765B1D7BDA5928a7F1BCe')
        const MoneyPotContract = new ethers.Contract('0x180b3622bcc123e900e5eb603066755418d0b4f5', MoneyPotABI.abi, provider)
        const signer2 = MoneyPotContract.connect(wallet)
        gasPrice = await getGasPrice(provider)
        let tx2 = await signer2.deposit(elctBalance, { gasPrice, })
        await tx2.wait()
        console.log(tx2)

    } catch (err) {
        console.log(err)
    }
}

const getGasPrice = async (provider) => {
    const GAS = "5";
    const gasPrice = await provider.getGasPrice();
    const convertGas = ethers.utils.parseUnits(GAS, "gwei");
    return gasPrice.add(convertGas);
};

const sleep = (seconds) => {
    return new Promise(resolve => setTimeout(() => resolve(null), seconds * 1000));
};

main()