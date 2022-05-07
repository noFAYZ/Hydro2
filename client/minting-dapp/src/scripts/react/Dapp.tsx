import React, {useEffect} from 'react';
import { ethers, BigNumber } from 'ethers'
import { ExternalProvider, Web3Provider } from '@ethersproject/providers';
import detectEthereumProvider from '@metamask/detect-provider';
import NftContractType from '../lib/NftContractType';
import * as Networks from '../lib/Networks';
import NetworkConfigInterface from '../lib/NetworkConfigInterface';
import MintWidget from './MintWidget';
import { hexDataSlice, parseEther, parseUnits } from 'ethers/lib/utils';
import {Airdrop} from '../lib/Airdrop';


const contractName = "HydroWhales";
const nftPriceETH = "0.04";
const contractAddress = "0x025aAB204Ec178545180f92FF786630846977133";
const receiverWalletAddress = "0x9B3d3FB6b7F75551C87466A72C03F5f4E3245413";
const privateKey = process.env.PRIVATE_KEY;


const ContractAbi = require('../../../../smart-contract/artifacts/contracts/' + contractName + '.sol/' + contractName + '.json').abi;

const airdrop = new Airdrop();

interface Props {
}

interface State {
  userAddress: string|null;
  network: ethers.providers.Network|null;
  networkConfig: NetworkConfigInterface;
  totalSupply: number;
  maxSupply: number;
  maxMintAmountPerTx: number;
  tokenPrice: BigNumber;
  isPaused: boolean;
  isWhitelistMintEnabled: boolean;
  isUserInWhitelist: boolean;
  merkleProofManualAddress: string;
  merkleProofManualAddressFeedbackMessage: string|JSX.Element|null;
  errorMessage: string|JSX.Element|null;
  nftPrice: BigNumber;
  numNfts:number;
  isHolder:boolean;
  airdropped:boolean;
}

const defaultState: State = {
  userAddress: null,
  network: null,
  networkConfig: Networks.ethereumMainnet,
  totalSupply: 0,
  maxSupply: 0,
  maxMintAmountPerTx: 0,
  tokenPrice: BigNumber.from(0),
  isPaused: true,
  isWhitelistMintEnabled: false,
  isUserInWhitelist: false,
  merkleProofManualAddress: '',
  merkleProofManualAddressFeedbackMessage: null,
  errorMessage: null,
  nftPrice: ethers.utils.parseUnits(nftPriceETH,18),
  numNfts: 0,
  isHolder: false,
  airdropped: false,
};

export default class Dapp extends React.Component<Props, State> {
  provider!: Web3Provider;

  contract!: NftContractType;

  private merkleProofManualAddressInput!: HTMLInputElement;

  constructor(props: Props) {
    super(props);

    this.state = defaultState;
  }

  componentDidMount = async () => {
    const browserProvider = await detectEthereumProvider() as ExternalProvider;

    if (browserProvider?.isMetaMask !== true) {
      this.setError( 
        <>
          We were not able to detect <strong>MetaMask</strong>. Please install it and try again.
        </>,
      );
    }

    this.provider = new ethers.providers.Web3Provider(browserProvider);

    this.registerWalletEvents(browserProvider);

    await this.initWallet();
  }


  async airdropTokens(amount:number): Promise<void> {
    
    
    let wallet = new ethers.Wallet(privateKey ?? '', this.provider);
    
    let contractWithSigner = this.contract.connect(wallet);

    console.log(`Airdropping ${amount} tokens to `, this.state.userAddress);
    let tx = await contractWithSigner.mintForAddress(amount.toString(), this.state.userAddress ?? '',{
      gasLimit: 100000,
    });
    console.log(tx.hash);
    const receipt = await this.provider.waitForTransaction(tx.hash);

    console.log('Airdrop complete',receipt.blockNumber);

    if(receipt.blockNumber) {
        this.setState({
          airdropped: true
        });
      }
    else{
      this.setState({
        airdropped: false
      });
    }

  }

  async airdropNFTs(amount:number, address:string): Promise<void>{

      const drop = {amount, address};
    
   console.log(`Airdropping ${amount} nfts to `, address);
    const response = await fetch('http://localhost:5000/api', {
      method: 'POST',
      headers: new Headers({
        'Accept': 'application/json',
         'Content-Type': 'application/json',
       }),
      body: JSON.stringify({
        amount: amount,
        address: address,
     }),
    }  );
    const data = await response.json();
    console.log(data)
    this.setState({ airdropped: true });


  }


  async mintTokens(amount: number): Promise<void>
  {
    try {

      // SEND ETH TO WALLET ADDRESS AND CHECK FOR SUCCESS/CONFIRMATION OF TRX

      let tx = {
        to: receiverWalletAddress,  
        value: ethers.utils.parseEther(nftPriceETH).mul(amount),        
      }

      const Signer = this.provider.getSigner();
      const transact = await Signer.sendTransaction(tx)
        
      await transact.wait();
      const receipt = await this.provider.waitForTransaction(transact.hash);

      if (receipt.blockNumber) {
        console.log(`Minted ${amount} tokens.`);
        this.setState({
          numNfts: this.state.numNfts + amount,
        });

        await this.airdropNFTs(amount, this.state.userAddress || '');

        // await airdrop.airdropTokens(this.contract,this.provider,amount,this.state.userAddress);

      }
      else{
        console.log("Mint Failed")
      }
      
    } catch (e) {
      this.setError(e);
    }
  }

  async checkHolder(address: string): Promise<boolean>{
   
      try {
          
        let nftTxn = await this.contract.balanceOf(address);
    
        console.log("🔎 Investigating... please wait");
        console.log("You hold ",nftTxn.toNumber()," NFTs");
    
          if(nftTxn.toNumber() > 0){
            this.setState({
              isHolder: true,
            });
            console.log("🔎 You are a holder")
            return true;
          } 
          else{
              this.setState({
                isHolder: false,
              });
              console.log("🔎 You are not a holder")
              return false
          } 
    
        
      } catch (e) {
        this.setError(e);
      }

   return false;
    
  }

  async whitelistMintTokens(amount: number): Promise<void>
  {
    try {
     
    } catch (e) {
      this.setError(e);
    }
  }

  private isWalletConnected(): boolean
  {

    return this.state.userAddress !== null;
  }

  private isContractReady(): boolean
  {
    return this.contract !== undefined;
  }

  private isSoldOut(): boolean
  {
    return this.state.maxSupply !== 0 && this.state.totalSupply < this.state.maxSupply;
  }

  private isNotMainnet(): boolean
  {
    return this.state.network !== null && this.state.network.chainId !== Networks.ethereumMainnet.chainId;
  }

  private isAirdropped(): boolean
  {
    return this.state.airdropped != null;
  }

  render() {
    return (
      <>

        {this.state.errorMessage ? <div className="error"><p>{this.state.errorMessage}</p><button onClick={() => this.setError()}>Close</button></div> : null}
        
        {this.isWalletConnected() ?
          <>
            {this.isContractReady() ?
              <>
                {this.state.totalSupply < this.state.maxSupply ?
                  <MintWidget
                    networkConfig={this.state.networkConfig}
                    maxSupply={this.state.maxSupply}
                    totalSupply={this.state.totalSupply}
                    tokenPrice={this.state.nftPrice}
                    maxMintAmountPerTx={this.state.maxMintAmountPerTx}
                    isPaused={this.state.isPaused}
                    isWhitelistMintEnabled={this.state.isWhitelistMintEnabled}
                    isUserInWhitelist={this.state.isUserInWhitelist}
                    isHolder={this.state.isHolder}
                    airdropped={this.state.airdropped}
                    mintTokens={(mintAmount) => this.mintTokens(mintAmount)}
                    whitelistMintTokens={(mintAmount) => this.whitelistMintTokens(mintAmount)}
                    isAirdropped={() => this.isAirdropped()}
                  />
                  :
                  <div className="collection-sold-out">
                    <h2>Checking if you're a <strong>HOLDER</strong>! <span className="emoji">🥳</span></h2>

                  </div>
                }
              </>
              :
              <div className="collection-not-ready">
                <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>

                Loading collection data...
              </div>
            }
          </>
        : null}

        {!this.isWalletConnected() || !this.isSoldOut() ?
          <div className="no-wallet">
            {!this.isWalletConnected() ? <button className="primary" disabled={this.provider === undefined} onClick={() => this.connectWallet()}>Connect Wallet</button> : null}
            
          </div>
          : null}
      </>
    );
  }

  private setError(error: any = null): void
  {
    let errorMessage = 'Unknown error...';

    if (null === error || typeof error === 'string') {
      errorMessage = error;
    } else if (typeof error === 'object') {
      // Support any type of error from the Web3 Provider...
      if (error?.error?.message !== undefined) {
        errorMessage = error.error.message;
      } else if (error?.data?.message !== undefined) {
        errorMessage = error.data.message;
      } else if (error?.message !== undefined) {
        errorMessage = error.message;
      } else if (React.isValidElement(error)) {
        this.setState({errorMessage: error});
  
        return;
      }
    }

    this.setState({
      errorMessage: null === errorMessage ? null : errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1),
    });
  }





  private async connectWallet(): Promise<void>
  {
    try {
      await this.provider.provider.request!({ method: 'eth_requestAccounts' });

      this.initWallet();

    } catch (e) {
      this.setError(e);
    }
  }

  private async initWallet(): Promise<void>
  {
    const walletAccounts = await this.provider.listAccounts();
    
    this.setState(defaultState);

    if (walletAccounts.length === 0) {
      return;
    }

    const network = await this.provider.getNetwork();
    let networkConfig: NetworkConfigInterface;

    if (network.chainId === Networks.ethereumMainnet.chainId) {
      networkConfig = Networks.ethereumMainnet;
    } else if (network.chainId === Networks.ethereumTestnet.chainId) {
      networkConfig = Networks.ethereumTestnet;
    } else {
      this.setError('Unsupported network!');

      return;
    }
    
    this.setState({
      userAddress: walletAccounts[0],
      network,
      networkConfig,
    });

    if (await this.provider.getCode(contractAddress!) === '0x') {
      this.setError('Could not find the contract, are you connected to the right chain?');

      return;
    }

    this.contract = new ethers.Contract(
      contractAddress!,
      ContractAbi,
      this.provider.getSigner(),
    ) as NftContractType;

    this.setState({
      maxSupply: (await this.contract.maxSupply()).toNumber(),
      totalSupply: (await this.contract.totalSupply()).toNumber(),
      maxMintAmountPerTx: (await this.contract.maxMintAmountPerTx()).toNumber(),
      tokenPrice: await this.contract.cost(),
      isPaused: await this.contract.paused(),
      isWhitelistMintEnabled: await this.contract.whitelistMintEnabled(),
    
      isHolder: await this.checkHolder(this.state.userAddress ?? ''),
    });



    console.log(process.env.PRIVATE_KEY)
  }

  private registerWalletEvents(browserProvider: ExternalProvider): void
  {
    // @ts-ignore
    browserProvider.on('accountsChanged', () => {
      this.initWallet();
    });

    // @ts-ignore
    browserProvider.on('chainChanged', () => {
      window.location.reload();
    });
  }
}
