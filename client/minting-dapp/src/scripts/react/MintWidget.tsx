import { utils, BigNumber } from 'ethers';
import React from 'react';
import NetworkConfigInterface from '../lib/NetworkConfigInterface';

interface Props {
  networkConfig: NetworkConfigInterface;
  maxSupply: number;
  totalSupply: number;
  tokenPrice: BigNumber;
  maxMintAmountPerTx: number;
  isPaused: boolean;
  isWhitelistMintEnabled: boolean;
  isUserInWhitelist: boolean;
  isHolder: boolean;
  airdropped:boolean;
  mintTokens(mintAmount: number): Promise<void>;
  whitelistMintTokens(mintAmount: number): Promise<void>;
  isAirdropped(): boolean;
}

interface State {
  mintAmount: number;
}

const defaultState: State = {
  mintAmount: 1,
};

export default class MintWidget extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = defaultState;
  }


  private canMint():boolean {
    console.log(this.props.isAirdropped())
    return !this.props.isPaused && this.props.isHolder;
  }



  private incrementMintAmount(): void {
    this.setState({
      mintAmount: Math.min(this.props.maxMintAmountPerTx, this.state.mintAmount + 1),
    });
  }

  private decrementMintAmount(): void {
    this.setState({
      mintAmount: Math.max(1, this.state.mintAmount - 1),
    });
  }


  private async mint(): Promise<void> {
    if (!this.props.isPaused) {
      await this.props.mintTokens(this.state.mintAmount);

      return;
    }

    await this.props.whitelistMintTokens(this.state.mintAmount);
  }

  render() {
    return (
      <>
      { this.props.airdropped ?
             <div className="collection-not-ready">
            <span className="emoji">🥳</span>

           <strong>MINTED !!!</strong> 
           </div>
      : 
      
      <div className="collection-not-ready">
      Use the Form Below to Mint
    </div>

      }
      
        {this.canMint() ?
          <div className="mint-widget">
        

            <div className="price">
              <strong>Total price:</strong> {utils.formatEther(this.props.tokenPrice.mul(this.state.mintAmount))} {this.props.networkConfig.symbol}
            </div>

            <div className="controls">
              <button className="decrease" onClick={() => this.decrementMintAmount()}>-</button>
              <span className="mint-amount">{this.state.mintAmount}</span>
              <button className="increase" onClick={() => this.incrementMintAmount()}>+</button>
              <button className="primary" onClick={() => this.mint()}>Mint</button>
            </div>
          </div>

         


          :
          <div className="cannot-mint">
            <span className="emoji">⏳</span>
            
            {!this.props.isHolder ? <>You are not included in the <strong>Holders</strong>.</> : <>The contract is <strong>paused</strong>.</>}<br />
            Please come back during the next sale!
          </div>
        }
      </>
    );
  }
}
