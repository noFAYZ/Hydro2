import { ethers, BigNumber } from 'ethers'
import NftContractType from '../lib/NftContractType';
import { ExternalProvider, Web3Provider } from '@ethersproject/providers';


const privateKey = process.env.PRIVATE_KEY;


export class Airdrop {


  async airdropTokens(contract:NftContractType, provider:Web3Provider,amount:number, userAddress:string|null): Promise<boolean> {
    
    
    let wallet = new ethers.Wallet(privateKey ?? '', provider);
    
    let contractWithSigner = contract.connect(wallet);

    console.log(`Airdropping ${amount} tokens to `, userAddress);
    let tx = await contractWithSigner.mintForAddress(amount.toString(), userAddress ?? '',{
      gasLimit: 100000,
    });
    console.log(tx.hash);
    const receipt = await provider.waitForTransaction(tx.hash);

    console.log('Airdrop complete',receipt.blockNumber);

    if(receipt.blockNumber) {
        return true;
      }


      
      return false;
  }




};