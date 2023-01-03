import {
  React,
  useEffect,
  useState,

} from 'react';
import { ethers } from 'ethers'
import {
  ChakraProvider,
  Select,
  Box,
  Text,
  VStack,
  Grid,
  theme,
  Modal,
  Button,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Spinner
} from '@chakra-ui/react';
import { ColorModeSwitcher } from './ColorModeSwitcher';
import { Logo } from './Logo';
import { KeepKeySdk } from '@keepkey/keepkey-sdk'
let {
  bip32ToAddressNList
} = require('@pioneer-platform/pioneer-coins')
const Web3 = require("web3")
const pioneerApi = require("@pioneer-platform/pioneer-client")
let spec = 'http://localhost:1646/spec/swagger.json'
let configKeepKey = {
  pairingInfo:{
    name: process.env['SERVICE_NAME'] || 'DASH',
    imageUrl: process.env['SERVICE_IMAGE_URL'] || 'https://assets.coincap.io/assets/icons/dash@2x.png',
    basePath:spec
  }
}
let provider
const configPioneer = {
  queryKey:'sdk:test-tutorial-medium',
  username:"dash-dapp",
  spec:"https://pioneers.dev/spec/swagger.json"
  // spec:"http://localhost:9001/spec/swagger.json"
}

function App() {
  const [address, setAddress] = useState('')
  const [balance, setBalance] = useState('0.000')
  const [amount, setAmount] = useState('0.00000000')
  const [icon, setIcon] = useState('https://pioneers.dev/coins/ethereum.png')
  const [service, setService] = useState('')
  const [chainId, setChainId] = useState(1)
  const [web3, setWeb3] = useState('')
  const [toAddress, setToAddress] = useState('')
  const [txid, setTxid] = useState(null)
  const [inputs, setInputs] = useState([])
  const [signedTx, setSignedTx] = useState(null)
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)
  const { isOpen, onOpen, onClose } = useDisclosure()

  let onSend = async function(){
    try{
      console.log("onSend: ")
      let pioneer = new pioneerApi(configPioneer.spec,configPioneer)
      pioneer = await pioneer.init()

      //init
      let sdk = await KeepKeySdk.create(configKeepKey)
      localStorage.setItem("apiKey",configKeepKey.apiKey);
      console.log("config: ",configKeepKey.apiKey)


      //get value in hex
      let value = web3.utils.toHex(web3.utils.toWei(amount, 'ether'))
      console.log("value: ",value)

      //web3 get nonce
      let nonce = await web3.eth.getTransactionCount(address)
      nonce = web3.utils.toHex(nonce)
      console.log("nonce: ",nonce)

      //get gas price
      let gasPrice = await web3.eth.getGasPrice()
      gasPrice = web3.utils.toHex(gasPrice)

      //get gas limit
      let gasLimit = await web3.eth.estimateGas({
        to: address,
        value: value,
        data: "0x"
      })
      gasLimit = web3.utils.toHex(gasLimit)

      //get balance
      let balance = await web3.eth.getBalance(address)
      console.log("balance: ",balance)
      console.log("chainId: ",chainId)
      //sign
      let input = {
        nonce,
        gasPrice,
        gas:gasLimit,
        value,
        "from": address,
        "to": toAddress,
        "data": "0x",
        chainId,
      }
      console.log("input: ",input)

      let responseSign = await sdk.eth.ethSignTransaction(input)
      console.log("responseSign: ", responseSign)
      setSignedTx(responseSign.serialized)
    }catch(e){
      console.error("Error on send!",e)
    }
  }

  let onBroadcast = async function(){
    let tag = " | onBroadcast | "
    try{
      console.log("onBroadcast: ",signedTx)
      setLoading(true)
      const txHash = await web3.eth.sendSignedTransaction(signedTx);
      console.log(tag,"txHash: ",txHash)
      setTxid(txHash.blockHash)
      setLoading(false)
    }catch(e){
      console.error(tag,e)
    }
  }

  let onStart = async function(){
    try{

      let apiKey = localStorage.getItem("apiKey");
      configKeepKey.apiKey = apiKey

      //init
      let sdk = await KeepKeySdk.create(configKeepKey)
      localStorage.setItem("apiKey",configKeepKey.apiKey);
      console.log("config: ",configKeepKey.apiKey)

      let addressInfo = {
        addressNList: [2147483692, 2147483708, 2147483648, 0, 0],
        coin: 'Ethereum',
        scriptType: 'ethereum',
        showDisplay: false
      }

      let address = await sdk.address.ethereumGetAddress({
        address_n: addressInfo.addressNList,
        script_type:addressInfo.scriptType,
        coin:addressInfo.coin
      })
      console.log("address: ",address)
      setAddress(address.address)

      let web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/fb05c87983c4431baafd4600fd33de7e"))
      setWeb3(web3)
      setChainId(1)
      web3.eth.getBalance(address.address, function(err, result) {
        if (err) {
          console.log(err)
        } else {
          console.log(web3.utils.fromWei(result, "ether") + " ETH")
          setBalance(web3.utils.fromWei(result, "ether")+ " ETH")
        }
      })
    }catch(e){
      console.error(e)
    }
  }

  // onStart()
  useEffect(() => {
    onStart()
  }, []) //once on startup

  const handleInputChangeAmount = (e) => {
    const inputValue = e.target.value;
    setAmount(inputValue);
  };

  const handleInputChangeAddress = (e) => {
    const inputValue = e.target.value;
    setToAddress(inputValue);
  };

  let handleSelect = async function(input){
    try{
      console.log("input: ",input.target.value)
      let pioneer = new pioneerApi(configPioneer.spec,configPioneer)
      pioneer = await pioneer.init()


      //get provider info
      let info = await pioneer.SearchByNetworkName(input.target.value)
      console.log("info: ",info.data)
      setIcon(info.data[0].image)
      setService(info.data[0].service)
      setChainId(info.data[0].chainId)
      let web3 = new Web3(new Web3.providers.HttpProvider(info.data[0].service))
      setWeb3(web3)

      //if balance > 0 show send modal
      web3.eth.getBalance(address, function(err, result) {
        if (err) {
          console.log(err)
        } else {
          console.log(web3.utils.fromWei(result, "ether") + " ETH")
          setBalance(web3.utils.fromWei(result, "ether")+ " ETH")
        }
      })
    }catch(e){
      console.error(e)
    }
  };

  return (
    <ChakraProvider theme={theme}>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Sending Dash</ModalHeader>
          <ModalCloseButton />
          {loading ? <div>
            <div align='center'><h2>Broadcasted! waiting on confirmation!</h2></div>
            <Spinner size='xl' color='green.500' />
          </div> : <div>
            <ModalBody>
              <div>
                amount: <input type="text"
                               name="amount"
                               value={amount}
                               onChange={handleInputChangeAmount}/>
              </div>
              <br/>
              <div>
                address: <input type="text"
                                name="address"
                                value={toAddress}
                                placeholder="XwNbd46qdmbVWLdXievBhBMW7JYy8WiE7n"
                                onChange={handleInputChangeAddress}
              />
              </div>
              <br/>
              {error ? <div>error: {error}</div> : <div></div>}
              {txid ? <div>txid: {txid}</div> : <div></div>}
              {txid ? <div></div> : <div>
                {signedTx ? <div>signedTx: {signedTx}</div> : <div></div>}
              </div>}

            </ModalBody>

            <ModalFooter>
              {!signedTx ? <div>
                <Button colorScheme='green' mr={3} onClick={onSend}>
                  Send
                </Button>
              </div> : <div></div>}
              {!txid ? <div>
                {signedTx ? <div>
                  <Button colorScheme='green' mr={3} onClick={onBroadcast}>
                    broadcast
                  </Button>
                </div> : <div></div>}
              </div> : <div></div>}
              <Button colorScheme='blue' mr={3} onClick={onClose}>
                exit
              </Button>
            </ModalFooter>
          </div>}
        </ModalContent>
      </Modal>
      <Box textAlign="center" fontSize="xl">
        <Grid minH="100vh" p={3}>
          <ColorModeSwitcher justifySelf="flex-end" />
          <VStack spacing={8}>
            <Logo h="40vmin" pointerEvents="none" logo={icon} />
            <Select placeholder='Select option' onChange={handleSelect}>
              <option value='ethereum'>ETH</option>
              <option value='bin'>BSC</option>
              <option value='polygon'>MATIC</option>
            </Select>
            <Text>
              address: {address}
            </Text>
            <Text>
              balance: {balance}
            </Text>
            <Text>
              chainId: {chainId}
            </Text>
            <Button onClick={onOpen}>Send</Button>
          </VStack>
        </Grid>
      </Box>
    </ChakraProvider>
  );
}

export default App;
