import '../styles/main.scss';

import ReactDOM from 'react-dom';
import Dapp from './react/Dapp';
import CollectionConfig from '../../../smart-contract/config/CollectionConfig';

if (document.title === '') {
  document.title = "HydroWhales Holder's Mint";
}

document.addEventListener('DOMContentLoaded', async () => {
  ReactDOM.render(<Dapp />, document.getElementById('minting-dapp'));
});
