const express = require('express');
const { ethers, providers } = require('ethers');
const { Provider } = require('@ethersproject/abstract-provider');

require('dotenv').config()
const app = express();
const abi = require('./abi.json').abi
const cors = require('cors');

const contractAddress = "0x025aAB204Ec178545180f92FF786630846977133"

const signer = new ethers.Wallet(
   process.env.PRIVATE_KEY,
   new providers.InfuraProvider('rinkeby', process.env.INFURA_API_KEY)
);

const provider = new providers.InfuraProvider('rinkeby', process.env.INFURA_API_KEY);

const contract = new ethers.Contract(contractAddress, abi, signer);

const airdropNfts = async (amount,address) =>  {
try{
    const a = await contract.mintForAddress(amount,address)
  
    const receipt = await provider.waitForTransaction(a.hash);
    console.log(receipt.blockNumber)
    if(receipt.status === 1){
        console.log('Airdrop complete');
        return true;
    }
    else{
        console.log('Airdrop failed');
        return false;
    }
}
catch(e){
    console.log("error",e)
}
    
 }

 const checkBalance = async (address) => {
     console.log(address)
     try{
        const a = await contract.balanceOf(address);
        console.log(a.toNumber());
     }
     catch(e){
            console.log("error",e)
     }
    
 }



app.use(cors({
    origin: '*'
}));
app.use(express.json());

app.post("/api", async (req,res)=>{

    try{

         const drop = await airdropNfts(req.body.amount,req.body.address).then(()=>{
                   console.log("success")
                  res.status(200).send({message:"success"});
           }).catch(()=>{
                  res.status(300).send({message:"success"});
                  console.log("error")
              }
          )
    
        res.status(200).send({message:"success"});
     }
     
     catch(e){
         console.log("error",e)
   
     }
    
});

 


app.listen(80,()=>{ console.log("Server is running on port 5000");})
