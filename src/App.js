import {
  React,
  useEffect,
  useState,

} from 'react';
import { Select as SelectImported, components } from "chakra-react-select";
import {
  ChakraProvider,
  Stack,
  CardBody,
  Card,
  Select,
  CardFooter,
  Heading,
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
  Image,
  FormLabel,
  FormControl,
  Spinner,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react';
import { ColorModeSwitcher } from './ColorModeSwitcher';
import { Logo } from './Logo';
import { KeepKeySdk } from '@keepkey/keepkey-sdk'
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
const configPioneer = {
  queryKey:'sdk:test-tutorial-medium',
  username:"dash-dapp",
  // spec:"https://pioneers.dev/spec/swagger.json"
  spec:"http://localhost:9001/spec/swagger.json"
}


function App() {
  const [address, setAddress] = useState('')
  const [balance, setBalance] = useState('0.000')
  const [tokenBalance, setTokenBalance] = useState('0.000')
  const [amount, setAmount] = useState('0.00000000')
  const [contract, setContract] = useState('')
  const [block, setBlock] = useState('')
  const [icon, setIcon] = useState('https://pioneers.dev/coins/ethereum.png')
  const [service, setService] = useState('')
  const [tokenName, setTokenName] = useState('')
  const [prescision, setPrescision] = useState('')
  const [token, setToken] = useState('')
  const [assets, setAssets] = useState('')
  const [blockchain, setBlockchain] = useState('')
  const [chainId, setChainId] = useState(1)
  const [web3, setWeb3] = useState('')
  const [toAddress, setToAddress] = useState('')
  const [txid, setTxid] = useState(null)
  const [signedTx, setSignedTx] = useState(null)
  const [loading, setLoading] = useState(null)
  const [isTokenSelected, setIsTokenSelected] = useState(null)
  const [error, setError] = useState(null)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [data, setData] = useState(() => [])
  const [query, setQuery] = useState('bitcoin...');
  const [timeOut, setTimeOut] = useState(null);

  let onSend = async function(){
    try{
      //console.log("onSend: ")
      let pioneer = new pioneerApi(configPioneer.spec,configPioneer)
      pioneer = await pioneer.init()

      //init
      let sdk = await KeepKeySdk.create(configKeepKey)
      localStorage.setItem("apiKey",configKeepKey.apiKey);
      //console.log("config: ",configKeepKey.apiKey)


      //get value in hex
      let value = web3.utils.toHex(web3.utils.toWei(amount, 'ether'))
      //console.log("value: ",value)

      //web3 get nonce
      let nonce = await web3.eth.getTransactionCount(address)
      nonce = web3.utils.toHex(nonce)
      //console.log("nonce: ",nonce)

      //get gas price
      let gasPrice = await web3.eth.getGasPrice()
      gasPrice = web3.utils.toHex(gasPrice)

      //get gas limit
      let gasLimit

      //get balance
      let balance = await web3.eth.getBalance(address)
      //console.log("balance: ",balance)
      //console.log("chainId: ",chainId)
      let input
      if(contract){
        //console.log("THIS IS A TOKEN SEND!")
        if(!contract) throw Error("Invalid token contract address")

        //get token data
        let tokenData = await web3.eth.abi.encodeFunctionCall({
          name: 'transfer',
          type: 'function',
          inputs: [
            {
              type: 'address',
              name: '_to'
            },
            {
              type: 'uint256',
              name: '_value'
            }
          ]
        }, [toAddress, value])

        //get gas limit
        gasLimit = await web3.eth.estimateGas({
          to: address,
          value: value,
          data: tokenData
        })
        gasLimit = web3.utils.toHex(gasLimit + 41000) // Add 21000 gas to cover the size of the data payload


        //sign
        input = {
          nonce,
          gasPrice,
          gas:gasLimit,
          value: "0x0",
          "from": address,
          "to": contract,
          "data": tokenData,
          chainId,
        }
        //console.log("input: ",input)

      } else {
        //console.log("THIS IS A NATIVE SEND!")
        //get gas limit
        let gasLimit = await web3.eth.estimateGas({
          to: address,
          value: value,
          data: "0x"
        })
        gasLimit = web3.utils.toHex(gasLimit)

        //sign
        input = {
          nonce,
          gasPrice,
          gas:gasLimit,
          value,
          "from": address,
          "to": toAddress,
          "data": "0x",
          chainId,
        }
        //console.log("input: ",input)
      }

      let responseSign = await sdk.eth.ethSignTransaction(input)
      //console.log("responseSign: ", responseSign)
      setSignedTx(responseSign.serialized)
    }catch(e){
      console.error("Error on send!",e)
    }
  }

  let onBroadcast = async function(){
    let tag = " | onBroadcast | "
    try{
      //console.log("onBroadcast: ",signedTx)
      setLoading(true)
      const txHash = await web3.eth.sendSignedTransaction(signedTx);
      //console.log(tag,"txHash: ",txHash)
      setTxid(txHash.transactionHash)
      setBlock(txHash.blockNumber)
      setLoading(false)
    }catch(e){
      console.error(tag,e)
    }
  }

  let onStart = async function(){
    try{
      let pioneer = new pioneerApi(configPioneer.spec,configPioneer)
      pioneer = await pioneer.init()
      let apiKey = localStorage.getItem("apiKey");
      configKeepKey.apiKey = apiKey
      //init
      let sdk = await KeepKeySdk.create(configKeepKey)
      localStorage.setItem("apiKey",configKeepKey.apiKey);
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
      setAddress(address.address)


      let info = await pioneer.SearchByNetworkName('ethereum')
      console.log("onStart: info: ",info.data[0])
      
      setIcon(info.data[0].image)
      setService(info.data[0].service)
      setChainId(info.data[0].chainId)
      setBlockchain(info.data[0].name)
      let web3 = new Web3(new Web3.providers.HttpProvider(info.data[0].service))
      setWeb3(web3)


      web3.eth.getBalance(address.address, function(err, result) {
        if (err) {
          console.error(err)
        } else {
          //console.log(web3.utils.fromWei(result, "ether") + " ETH")
          setBalance(web3.utils.fromWei(result, "ether")+ " ETH")
        }
      })

      //get tokens for chain
      let assets = await pioneer.SearchByNameAndChainId({chainId,name: 'fox'})
      assets = assets.data
      //console.log("assets: ",assets.length)
      let assetsFormated = []
      for(let i = 0; i < assets.length; i++){
         let asset = assets[i]
        asset.value = asset.name
        asset.label = asset.name
        assetsFormated.push(asset)
      }
      //console.log("assetsFormated: ",assetsFormated.length)
      setAssets(assetsFormated)
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

  // const handleInputChangeContract = (e) => {
  //   const inputValue = e.target.value;
  //   setContract(inputValue);
  //
  // };

  let handleInputChangeContract = async function(input){
    try{
      const inputValue = input.target.value;
      console.log("handleInputChangeContract: ",inputValue)
      setContract(inputValue);
      if(inputValue.length > 16 && inputValue.indexOf("0x") >= 0){
        let minABI = [
          // balanceOf
          {
            "constant":true,
            "inputs":[{"name":"_owner","type":"address"}],
            "name":"balanceOf",
            "outputs":[{"name":"balance","type":"uint256"}],
            "type":"function"
          },
          // decimals
          {
            "constant":true,
            "inputs":[],
            "name":"decimals",
            "outputs":[{"name":"","type":"uint8"}],
            "type":"function"
          }
        ];
        const newContract = new web3.eth.Contract(minABI, inputValue);
        const decimals = await newContract.methods.decimals().call();
        setPrescision(decimals)
        const balanceBN = await newContract.methods.balanceOf(address).call()
        //console.log("input: balanceBN: ",balanceBN)
        let tokenBalance = parseInt(balanceBN/Math.pow(10, decimals))
        if(tokenBalance > 0){
          setError(null)
          console.log("input: tokenBalance: ",tokenBalance)

          setTokenBalance(tokenBalance)
        }else{
          setError("You do NOT have a balance on this token! chainId: "+chainId+" contract: "+contract)
        }
      } else {
        setError("Invalid contract! must start with 0x")
      }


    }catch(e){
      console.error(e)
    }
  };

  const handleInputChangeAddress = (e) => {
    const inputValue = e.target.value;
    setToAddress(inputValue);
  };

  let handleSelect = async function(input){
    try{
      console.log("handleSelect input: ",input.target.value)
      let pioneer = new pioneerApi(configPioneer.spec,configPioneer)
      pioneer = await pioneer.init()


      //get provider info
      let info = await pioneer.SearchByNetworkName(input.target.value)
      console.log("handleSelect: ",info.data[0])
      console.log("handleSelect: chainId: ",info.data[0].chainId)

      setIcon(info.data[0].image)
      setService(info.data[0].service)
      setChainId(info.data[0].chainId)
      setBlockchain(info.data[0].name)
      let web3 = new Web3(new Web3.providers.HttpProvider(info.data[0].service))
      setWeb3(web3)

      //if balance > 0 show send modal
      web3.eth.getBalance(address, function(err, result) {
        if (err) {
          //console.log(err)
        } else {
          //console.log(web3.utils.fromWei(result, "ether") + " ETH")
          setBalance(web3.utils.fromWei(result, "ether")+ " ETH")
        }
      })
    }catch(e){
      console.error(e)
    }
  };

  let handleClose = async function(input){
    try{
      setTxid(null)
      setSignedTx(null)
      setToken(null)
      setBlock(null)
      setContract(null)
      onClose()
    }catch(e){
      console.error(e)
    }
  };

  let closeToken = async function(){
    try{
      setToken(null)
      setTokenName(null)

    }catch(e){
      console.error(e)
    }
  };

  const { Option } = components;
  const IconOption = props => {
    return(
    <Option {...props}>
      <Card
        direction={{ base: 'column', sm: 'row' }}
        overflow='hidden'
        variant='outline'
      >
        <Stack>
          <Image
            width={20}
            height={20}
            objectFit='cover'
            src={props.data.image}
          />
        </Stack>
        <Stack>
          <CardBody>
            <Grid >
              <Heading size='md'>{props.data.name}</Heading>
              <Text>symbol: {props.data.symbol}</Text>
              <Text>link: <a href={props.data.explorer} target="_blank" ><Text color="blue">View Explorer</Text></a></Text>
            </Grid>
          </CardBody>
        </Stack>
      </Card>
    </Option>
  )};

  let onSelectedToken = async function(input){
    try{
      //console.log("input: onSelectedToken: ",input)
      //console.log("input: name: ",input.name)
      //console.log("input: contract: ",input.contract)
      //console.log("input: description: ",input.contract)
      //console.log("input: explorer: ",input.explorer)
      //console.log("input: decimals: ",input.decimals)

      //set token
      setToken(input)
      //get balance

      let minABI = [
        // balanceOf
        {
          "constant":true,
          "inputs":[{"name":"_owner","type":"address"}],
          "name":"balanceOf",
          "outputs":[{"name":"balance","type":"uint256"}],
          "type":"function"
        },
        // decimals
        {
          "constant":true,
          "inputs":[],
          "name":"decimals",
          "outputs":[{"name":"","type":"uint8"}],
          "type":"function"
        }
      ];
      const newContract = new web3.eth.Contract(minABI, input.contract);
      const decimals = await newContract.methods.decimals().call();
      const symbol = await newContract.methods.symbol().call();
      console.log("input: symbol: ",symbol)
      const balanceBN = await newContract.methods.balanceOf(address).call()
      //console.log("input: balanceBN: ",balanceBN)
      let tokenBalance = parseInt(balanceBN/Math.pow(10, decimals))
      //console.log("input: tokenBalance: ",tokenBalance)

      setTokenBalance(tokenBalance)
    }catch(e){
      console.error(e)
    }
  };

  const handleKeyPress = (event) => {
    console.log("Handle Search! handleKeyPress")
    if (timeOut) {
      clearTimeout(timeOut);
    }
    setQuery(event.target.value);
    setTimeOut(setTimeout(() => {
      search(query);
    }, 1000));
  }

  const search = async (query) => {
    let pioneer = new pioneerApi(configPioneer.spec,configPioneer)
    pioneer = await pioneer.init()

    let assets = await pioneer.SearchByNameAndChainId({chainId,name:query})
    assets = assets.data
    console.log("search assets: ",assets.length)

    let assetsFormated = []
    for(let i = 0; i < assets.length; i++){
      let asset = assets[i]
      asset.value = asset.name
      asset.label = asset.name
      assetsFormated.push(asset)
    }
    console.log("search assetsFormated: ",assetsFormated.length)
    setAssets(assetsFormated)
  };

  let handleClickTabs = async function(event){
    try{
      console.log("Tab Clicked!")
      let pioneer = new pioneerApi(configPioneer.spec,configPioneer)
      pioneer = await pioneer.init()

      //get tokens for chain

      let assets = await pioneer.SearchAssetsListByChainId({chainId,limit:100,skip:0})
      assets = assets.data
      //console.log("assets: ",assets.length)
      let assetsFormated = []
      for(let i = 0; i < assets.length; i++){
        let asset = assets[i]
        asset.value = asset.name
        asset.label = asset.name
        assetsFormated.push(asset)
      }
      console.log("handleSelect: assetsFormated: ",assetsFormated.length)
      setAssets(assetsFormated)

    }catch(e){
      console.error(e)
    }
  };

  return (
    <ChakraProvider theme={theme}>
      <Modal isOpen={isOpen} onClose={handleClose} size={'xxl'}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Broadcasting to {blockchain}</ModalHeader>
          <ModalCloseButton />
          {loading ? <div>
            <div align='center'><h2>Broadcasted! waiting on confirmation!</h2></div>
            <Spinner size='xl' color='green.500' />
          </div> : <div>
            <ModalBody>
              <Tabs>
                <TabList>
                  <Tab>Native</Tab>
                  <Tab onClick={handleClickTabs}>Token</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel>
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
                                      placeholder="0x651982e85D5E43db682cD6153488083e1b810798"
                                      onChange={handleInputChangeAddress}
                    />
                    </div>
                  </TabPanel>
                  <TabPanel>
                    <div>
                      contract: <input type="text"
                                                name="contract"
                                                value={contract}
                                                onChange={handleInputChangeContract}/>
                    </div>
                    {tokenBalance ? <div>tokenBalance: {tokenBalance}</div> : <div>no token balance</div>}
                    {prescision ? <div>prescision: {prescision}</div> : <div></div>}
                    <Text color='red.500'>{error}</Text>
                    <br/>

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
                                      placeholder="0x651982e85D5E43db682cD6153488083e1b810798"
                                      onChange={handleInputChangeAddress}/>
                    </div>


                      {/*{token ? <div>*/}
                      {/*  <Card*/}
                      {/*    direction={{ base: 'column', sm: 'row' }}*/}
                      {/*    overflow='hidden'*/}
                      {/*    variant='outline'*/}
                      {/*  >*/}
                      {/*    <Stack>*/}
                      {/*      <Button*/}
                      {/*        onClick={() => closeToken()}*/}
                      {/*        position="absolute"*/}
                      {/*        right="1rem"*/}
                      {/*        top="1rem"*/}
                      {/*        variant="ghost"*/}
                      {/*        variantColor="teal"*/}
                      {/*        size="sm"*/}
                      {/*      >*/}
                      {/*        X*/}
                      {/*      </Button>*/}
                      {/*      <Image*/}
                      {/*        width={130}*/}
                      {/*        height={130}*/}
                      {/*        objectFit='cover'*/}
                      {/*        src={token.image}*/}
                      {/*      />*/}
                      {/*    </Stack>*/}
                      {/*    <Stack>*/}
                      {/*      <CardBody>*/}
                      {/*        <Grid >*/}
                      {/*          <Heading size='md'>{token.name}</Heading>*/}
                      {/*          <Text py='2'>{token.description}</Text>*/}
                      {/*          <Text py='2'>contract:{token.contract}</Text>*/}
                      {/*          <Text py='2'>blockchain: {token.blockchain}</Text>*/}
                      {/*          <Text>link: <a href={token.explorer} target="_blank" ><Text color="blue">View Explorer</Text></a></Text>*/}
                      {/*        </Grid>*/}
                      {/*        <Card>*/}
                      {/*          <Text display="block" fontSize="2xl" textAlign="right">balance({token.symbol}): {tokenBalance}</Text>*/}
                      {/*        </Card>*/}
                      {/*      </CardBody>*/}
                      {/*    </Stack>*/}
                      {/*  </Card>*/}
                      {/*  <br/>*/}
                      {/*  <Card*/}
                      {/*    direction={{ base: 'column', sm: 'row' }}*/}
                      {/*    overflow='hidden'*/}
                      {/*    variant='outline'*/}
                      {/*  >*/}
                      {/*    <Stack>*/}
                      {/*  <div>*/}
                      {/*    amount: <input type="text"*/}
                      {/*                   name="amount"*/}
                      {/*                   value={amount}*/}
                      {/*                   onChange={handleInputChangeAmount}/>*/}
                      {/*  </div>*/}
                      {/*  <br/>*/}
                      {/*  <div>*/}
                      {/*    address: <input type="text"*/}
                      {/*                    name="address"*/}
                      {/*                    value={toAddress}*/}
                      {/*                    placeholder="0x651982e85D5E43db682cD6153488083e1b810798"*/}
                      {/*                    onChange={handleInputChangeAddress}*/}
                      {/*  />*/}
                      {/*  </div>*/}
                      {/*    </Stack>*/}
                      {/*  </Card>*/}
                      {/*</div> : <div>*/}
                      {/*  <div>*/}
                      {/*    <Text> Search by Token name/symbol/contract... </Text>*/}
                      {/*  </div>*/}
                      {/*  <FormControl p={4}>*/}
                      {/*    <SelectImported*/}
                      {/*      defaultMenuIsOpen={true}*/}
                      {/*      // isMulti*/}
                      {/*      name="assets"*/}
                      {/*      options={assets}*/}
                      {/*      placeholder="usdc... dogelonmars... 0x2342...."*/}
                      {/*      closeMenuOnSelect={true}*/}
                      {/*      onKeyDown={handleKeyPress}*/}
                      {/*      components={{ Option: IconOption }}*/}
                      {/*      onChange={onSelectedToken}*/}
                      {/*    ></SelectImported>*/}

                      {/*  </FormControl>*/}
                      {/*</div>}*/}
                  </TabPanel>
                </TabPanels>
                <br/>
                {error ? <div>error: {error}</div> : <div></div>}
                {txid ? <div>txid: {txid}</div> : <div></div>}
                {block ? <div>confirmed in block: {block}</div> : <div></div>}
                {txid ? <div></div> : <div>
                  {signedTx ? <div>signedTx: {signedTx}</div> : <div></div>}
                </div>}
              </Tabs>

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
              <Button colorScheme='blue' mr={3} onClick={handleClose}>
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
            <Grid
              templateRows="1fr 1fr 1fr"
              gap="1rem"
              alignItems="center"
            >
              <Box p="1rem" border="1px" borderColor="gray.300">
                <Text fontSize="xl" fontWeight="bold">
                  Selected: {blockchain} (chainId{chainId})
                </Text>
                <Select placeholder={'selected: '+blockchain} defaultValue='ethereum' onChange={handleSelect}>
                  <option value='ethereum'>ETH</option>
                  <option value='bin'>BSC</option>
                  <option value='polygon'>MATIC</option>
                </Select>
              </Box>
              <Box p="1rem" border="1px" borderColor="gray.300">
                <Text>
                  address: {address}
                </Text>
              </Box>
              <Box p="1rem" border="1px" borderColor="gray.300">
                <Text>
                  balance: {balance}
                </Text>
              </Box>
              <Box p="1rem" border="1px" borderColor="gray.300">
                <Button colorScheme='green' onClick={onOpen}>Send</Button>
              </Box>
            </Grid>
          </VStack>
        </Grid>
      </Box>
    </ChakraProvider>
  );
}

export default App;
