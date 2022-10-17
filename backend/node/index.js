const express = require('express')
const app = express()
var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
PORT = 3003

const axios = require('axios').default;

// Elliptic modules for signing and verification
var EC = require('elliptic').ec;
var ec = new EC('secp256k1');
const crypto = require('crypto');

// mongo setup
var moment = require('moment')
const mongoose = require("mongoose");
mongoose.connect("mongodb://0.0.0.0:27017/")

// loads the server info file, that contains all the server info
const serverInitInfo = require('./serverInit.json');
// gets the server name
const serverName = serverInitInfo[0].serverName

// server info
const serverInfoSchema = {
    serverName: String,
    stateHash: String,
    stateTime: String,
    nodeList: Array
};
const serverInfo = mongoose.model(serverName + "__serverInfo", serverInfoSchema)


// // <<<============================================== ALL SCHEMA's ARE DECLARED HERE ==============================================>>>
// // <<<============================================== ALL SCHEMA's ARE DECLARED HERE ==============================================>>>
// // <<<============================================== ALL SCHEMA's ARE DECLARED HERE ==============================================>>>
// server data
const messageAndChannelSchema = {
    channelName: String,
    data: Array
};
const messageAndChannelData = mongoose.model(serverName + "__messageAndChannelData", messageAndChannelSchema)

// user data
const userInfoSchema = {
    user: String,
    publicKey: String,
    img: String,
    isAdmin: Boolean
};
const userInfoData = mongoose.model(serverName + "__userInfoData", userInfoSchema)

// nodes where we have been registered
const registeredNodesSchema = {
    node: String,
    data: Array
};
const registeredNodes = mongoose.model(serverName + "__registeredNodes", registeredNodesSchema)


// // <<<=============================================== SUPPORT FUNCTIONS STARTS HERE ===============================================>>>
// // <<<=============================================== SUPPORT FUNCTIONS STARTS HERE ===============================================>>>
// // <<<=============================================== SUPPORT FUNCTIONS STARTS HERE ===============================================>>>
// returns SHA256 hash of any given string
function getHash(param) {
    const SHA256 = crypto.createHash('sha256').update(param).digest('hex');
    return SHA256
}

// verifies the signed epoch with the public key
function verdict(publicKey, signedMessage, data, user) {
    return new Promise(async(resolve, reject) => {
        const getKey = ec.keyFromPublic(publicKey, 'hex')
        if (user != 'isAdmin') {
            await userInfoData.find({user: user}).then((result) => {
                if (result[0].publicKey === publicKey ) {
                    resolve(getKey.verify(getHash(data), signedMessage))
                }
            })
        } else {
            resolve(getKey.verify(getHash(data), signedMessage))
        }
    })
    
}

// updates state without updating the time. Used to verify the state
function updateStateWithoutTime() {
    return new Promise(async(resolve, reject) => {
        // get users and channel/messages data
        await userInfoData.find({},{_id:0}).then(async(result) => {
            await messageAndChannelData.find({},{_id:0}).then(async(result1) => {

                // concats the users and channel/messages data, and gets the SHA256 hash(state)
                const stateHash = getHash(JSON.stringify(result)+JSON.stringify(result1))

                await serverInfo.find({},{_id:0}).then(async(resul2) => {
                    // checks if server info exists, if yes then we check the current state is equal to the hash above
                    if (resul2.length > 0 && resul2[0].stateHash != stateHash) {
                        // updates server info with the hash calculated above, if the above condition is met
                        await serverInfo.update({stateHash: resul2[0].stateHash}, {$set: {stateHash: stateHash}}).then(() => {
                            resolve(resul2)
                        })
                    } else {
                        resolve(resul2)
                    }
                    
                })
            })
        })
    })
}

// updates the state along with the time, when there are any changes made
function updateState() {
    return new Promise(async(resolve, reject) => {
        // get users and channel/messages data
        await userInfoData.find({},{_id:0}).then(async(result) => {
            await messageAndChannelData.find({},{_id:0}).then(async(result1) => {

                // concats the users and channel/messages data, and gets the SHA256 hash(state)
                const stateHash = getHash(JSON.stringify(result)+JSON.stringify(result1))
                
                await serverInfo.find({},{_id:0}).then(async(resul2) => {
                    
                    // checks if server info exists, if yes then we check the current state is equal to the hash above
                    if (resul2.length > 0 && resul2[0].stateHash != stateHash) {
                        
                        // updates server info with the hash calculated above, if the above condition is met
                        await serverInfo.update({stateHash: resul2[0].stateHash}, {$set: {stateHash: stateHash}}).then(() => {
                            // updates the time of when the last hash was calculated
                            serverInfo.update({stateTime: resul2[0].stateTime}, {$set: {stateTime: (Math.floor(+new Date() / 1000)).toString()}}).then(() => {
                                resolve(resul2)
                            })
                        })
                    } else {
                        resolve(resul2)
                    }
                    
                })
            })
        })
    })
}

// initialize function
async function init() {
    // looks for new nodes to add to our nodeList
    async function getMoreNodes() {
        
        // keeps track of all the nodes
        let tempArr = []
        // this is responsible to make sure that we only call the nodeRegister() function once
        let updatedServerInfo = false
        
        // registers itself with other new nodes, if not done already
        async function nodeRegister() {
            // checks weather or not this function has been called before or not, if not then we proceed further
            if (!updatedServerInfo) {
                // makes the updatedServerInfo variable true, so that it does not run multiple times
                updatedServerInfo = true
                await serverInfo.find({},{_id:0}).then(async (result4) => {

                    // cycles through the nodes present in the db, using index as the variable
                    for (index in result4[0].nodeList) {
                        const node = result4[0].nodeList[index]

                        // checks if index has been registered with or not
                        await registeredNodes.find({node: node},{_id:0}).then(async (result5) => {
                            if (result5.length === 0 && index < result4[0].nodeList.length) {
                                // if not, we register ourselves with the node index
                                axios.post(result4[0].nodeList[index] + '/registerNode', {node: serverInitInfo[0].myUrl}).then(async () => {
                                    const data = await new registeredNodes({
                                        node: node,
                                        data: []
                                    });
                                    // and after registering, we add ourselves to the registered node db
                                    await data.save()

                                    return
                                }).catch((err) => {})
                            }
                        })
                    }
                })
                
            }
        }
        
        await serverInfo.find({},{_id:0}).then(async(result) => {
            // loops through all the existing nodes in our db; uses the variable, index to do that
            for (index in result[0].nodeList) {
                
                // checks if index is not equal to itself (important because we do not want to ddos ourselves)
                if (result[0].nodeList[index] != serverInitInfo[0].myUrl) {
                    // checks if the index variable is already inside the tempArr
                    if (!tempArr.includes(result[0].nodeList[index])) {
                        // if not, then we push it into the tempArr
                        tempArr.push(result[0].nodeList[index])                    
                    }
                }

                // here we get the info of the index nodes
                await axios.get(result[0].nodeList[index] + '/state').then((result0) => {
                    // now we cycle through the nodes present with the index node; we use the index0 variable to do that
                    for (index0 in result0.data.nodeList) {
                        
                        // checks if index0 is not equal to itself (important because we do not want to ddos ourselves)
                        if (result0.data.nodeList[index0] != serverInitInfo[0].myUrl) {
                            // checks if tempArr already has index0 or not
                            if (!tempArr.includes(result0.data.nodeList[index0])) {
                                // if not then we push it to the tmepArr
                                tempArr.push(result0.data.nodeList[index0])                            
                            }       
                        }
                    
                    }
                }).then(async() => {
                    
                    if (tempArr.length != 0) {
                        // if the tempArr has some elements, then we update the old nodeList with tempArr(which is a more recent version of the nodeList)
                        await serverInfo.update({nodeList: result[0].nodeList}, {$set: {nodeList: tempArr}}).then(async(result3) => {
                            await nodeRegister()
                        })                        
                    }
                }).catch((res) => {})
            }
        })
    }

    // gets user info and message/channel info, and calculates a SHA256 hash
    await userInfoData.find({},{_id:0}).then(async(result0) => {
        await messageAndChannelData.find({},{_id:0}).then(async(result1) => {
            let state = getHash(JSON.stringify(result0)+JSON.stringify(result1))

            await serverInfo.find({serverName: serverName},{_id:0}).then(async(result2) => {

                // updates the serverInfo with new nodes addresses mentioned in the serverInfo.json file, if not done already
                if (result2.length != 0) {

                    let tempArr = []
                    for (index in serverInitInfo[0].initialNodes) {
                        if (tempArr.includes(result2[0].nodeList[index] && result2[0].nodeList[index] != serverInitInfo[0].myUrl)) {} else {
                            tempArr.push(serverInitInfo[0].initialNodes[index])
                        }
                    }

                    if (result2[0].nodeList != tempArr) {
                        await serverInfo.update({nodeList: result2[0].nodeList}, {$set: {nodeList: tempArr}}).then(async(result3) => {await getMoreNodes()})
                    }
                } 
                
                // if the serverInfo is not populated, then it goes through the initial nodes mentioned in the serverInit.json files and adds it to the serverInfo db
                else if (result2.length === 0) {
                    // adds all the nodes from the serverInit.json  into the tempArr
                    let tempArr = []
                    for (index in serverInitInfo[0].initialNodes) {
                        tempArr.push(serverInitInfo[0].initialNodes[index])
                    }

                    // populates the db with the new values
                    new serverInfo({
                        serverName: serverName,
                        stateHash: state,
                        stateTime: "null",
                        nodeList: tempArr
                    }).save().then(async() => {
                        // cycles through inital nodes with the variable, index
                        for (index in serverInitInfo[0].initialNodes) {
                            tempArr.push(serverInitInfo[0].initialNodes[index])
                            
                            // gets the state of the initial nodes
                            await axios.get(serverInitInfo[0].initialNodes[index] + '/state').then(async(result3) => {
                                if (result3.data.nodeList != undefined) {
                                    
                                    // cycles through all the nodes in the index node with the variable, index0
                                    for (index0 in result3.data.nodeList) {
                                        // checks if the index0 exists in the tempArr, if not then it adds the index0 node to the tempArr
                                        if (!tempArr.includes(result3.data.nodeList[index0]) && result3.data.nodeList[index0] != serverInitInfo[0].myUrl) {
                                            tempArr.push(result3.data.nodeList[index0])
                                        }
                                    }
                                    
                                    // updates the db with the updated node list
                                    await serverInfo.update({nodeList: []}, {$set: {nodeList: tempArr}}).then(async(result3) => {await getMoreNodes()})
                                } 
                            }).catch((err) => {})
                        }
                    })
                } 
                
                // for if the serverInfo is populated, but no nodes are present
                else if (result2.length != 0 && result2[0].nodeList && result2[0].nodeList.length === 0) {
                    // adds the serverInit.json nodes in the tempArr, and then updates the serverInfo with the tempArr (which consists all the new nodes)
                    let tempArr = []
                    for (index in serverInitInfo[0].initialNodes) {
                        if (tempArr.includes(result2[0].nodeList[index] && result2[0].nodeList[index] != serverInitInfo[0].myUrl)) {} else {
                            tempArr.push(serverInitInfo[0].initialNodes[index])
                        }
                    }

                    await serverInfo.update({nodeList: []}, {$set: {nodeList: tempArr}}).then(async(result3) => {await getMoreNodes()})
                }
            })
        })
    })
}
init()

async function checkForUpdatesAndSync() {
    // responsible for storing all the nodes with a different state hash value, and also tracks the number of time a given node was present
    let syncMismatch = []
    // responsible for storing the node which occurs the most in the syncMismatch array
    let maxNodeVerdict = []

    function maxMismatchFinder() {
        let uniqueValArr = []
        // the below for function goes through all the nodes with a different hash using the variable, index
        for (index in syncMismatch) {
            // appends the initial value to the uniqueValArr, if its length is zero
            // the counter variable counts how many nodes have that particular varibale; the node variable is updated only once for each unique hash
            if (uniqueValArr.length === 0) {
                uniqueValArr.push({
                    node: syncMismatch[0].node,
                    stateHash: syncMismatch[0].stateHash,
                    counter: 0
                })
            }

            for (index0 in uniqueValArr) {
                // checks if a hash exists and increments the counter varibale, by one
                if (uniqueValArr[index0].stateHash === syncMismatch[index].stateHash) {
                    uniqueValArr[index0].counter = uniqueValArr[index0].counter + 1
                } else {
                    // if a given hash does not exist, then we will add it to the uniqueValArr array
                    let exists = false
                    for (index1 in uniqueValArr) {
                        if (uniqueValArr[index1].stateHash === syncMismatch[index].stateHash) {
                            exists = true
                        }
                    }
                    if (!exists) {
                        uniqueValArr.push({
                            node: syncMismatch[index].node,
                            stateHash: syncMismatch[index].stateHash,
                            counter: 1
                        })
                    }
                }
            }
        }

        // adds the node with the highest counter variable to the maxNodeVerdict array
        for (index in uniqueValArr) {
            if (maxNodeVerdict.length === 0) {
                maxNodeVerdict.push(uniqueValArr[0])
            }

            if (maxNodeVerdict[0].counter < uniqueValArr[index].counter) {
                maxNodeVerdict = uniqueValArr[index]
            }
        }

        // selects a random node from the syncMismatch with the same hash as in the maxNodeVerdict, and updates the node in the maxNodeVerdict with the randomised syncMismatch node
        function selectRandomNode() {
            if (maxNodeVerdict.length>0) {
                if (syncMismatch[Math.floor(Math.random()*syncMismatch.length)].stateHash === maxNodeVerdict[0].stateHash) {
                    maxNodeVerdict[0].node = syncMismatch[Math.floor(Math.random()*syncMismatch.length)].node
                } else {
                    selectRandomNode()
                }
            }
        }
        selectRandomNode()
    }


    function syncData() {
        return new Promise(async(resolve, reject) => {
            try {
                // gets data from the node with different data
                await axios.get(maxNodeVerdict[0].node + '/getData').then((result1) => {
                    
                    // updates channel names & messages in our db
                    function updateMessageAndChannelData() {
                        return new Promise(async(resolve, reject) => {
                            await messageAndChannelData.find({},{_id:0}).then(async(result2) => {
                                
                                for (index in result2) {
                                    await messageAndChannelData.update({
                                        channelName: result2[index].channelName, data: result2[index].data}, 
                                        {$set: {channelName: result1.data.message[index].channelName, data: result1.data.message[index].data}
                                    }).then((result3) => {
                                        resolve(result3)
                                    })
                                }                                
                            }).catch((err) => {})
                        })
                    }
                    
                    // updates the user information in our db
                    function updateUserInfoData() {
                        return new Promise(async(resolve, reject) => {
                            await userInfoData.find({},{_id:0}).then(async(result2) => {

                                for (index in result2) {
                                    await userInfoData.update({
                                        user: result2[index].user, 
                                        publicKey: result2[index].publicKey, 
                                        img: result2[index].img, 
                                        isAdmin: result2[index].isAdmin
                                    }, 
                                    {$set: {
                                        user: result1.data.users[index]}.user, 
                                        publicKey: result1.data.users[index].publicKey, 
                                        img: result1.data.users[index].img, 
                                        isAdmin: result1.data.users[index].isAdmin
                                    }).then((result3) => {
                                    resolve(result3)
                                    })
                                }

                            }).catch((err) => {})
                        })
                    }

                    // runs updateMessageAndChannelData(), then updateUserInfoData() and finally updates the state
                    updateMessageAndChannelData().then(() => {
                        updateUserInfoData().then((result3) => {
                            updateState().then((result) => {
                                resolve(result3)
                            })
                        })
                    })
                })
            } catch {
                maxMismatchFinder()
                // sync()
                syncData()
            }
        })
    }

    // locally updates state, without updating time (becuase we have not synced it with any other node)
    await updateStateWithoutTime()
    await serverInfo.find({},{_id:0}).then(async(result) => {
        // keeps track if we has detected a new latest state or not
        let stateChangeStatus = false

        // proceeds if the serverInfo is populated
        if (result.length != 0) {
            // cycles through the nodeList in serverInfo, with the variable index
            for (index in result[0].nodeList) {
                
                // gets state of the node index
                await axios.get(result[0].nodeList[index] + '/state').then((result0) => {
                   
                    // checks if the local state and the index state match, if not then it proceeds forwards
                    if (result[0].stateHash != result0.data.stateHash) {
                        // checks if the node index was updates recently or not, if yes the it procceds forward
                        if (parseInt(result0.data.stateTime) > parseInt(result[0].stateTime) || result[0].stateTime === "null") {
                            stateChangeStatus = true
                            
                            // pushes the node along with the index state hash to the syncMismatch array
                            syncMismatch.push({ node: result[0].nodeList[index], stateHash: result0.data.stateHash })
                        }
                    }
                }).catch((err) => {})
            }

            // checks if we have detected a new state
            if (stateChangeStatus) {
                // checks for majority
                if (Math.ceil(result[0].nodeList.length / 2) < syncMismatch.length) {
                    // finds the nodes with different states
                    maxMismatchFinder()
                    // checks for if majority exists in the maxNodeVerdict array
                    if (Math.ceil(result[0].nodeList.length / 2) < maxNodeVerdict[0].counter) {
                        // if yes, then we sync the data & update the state
                        syncData().then(async() => {
                            await updateState().then(() => {
                                return
                            })
                        })
                    } else {
                        // if not, then we only update the state
                        updateState().then(() => {
                            return
                        })
                    }
                    
                }
            }
        }
    })
}
checkForUpdatesAndSync()

// // <<<=============================================== API FUNCTIONS STARTS HERE ===============================================>>>
// // <<<=============================================== API FUNCTIONS STARTS HERE ===============================================>>>
// // <<<=============================================== API FUNCTIONS STARTS HERE ===============================================>>>
// // state && epoch
app.get('/state', async function (req, res) {
    await updateState().then((result) => {
        res.send(result[0])
    })
})

// // getData
app.get('/getData', async function (req, res) {
    async function main() {
        await messageAndChannelData.find({},{_id:0}).then(async(result) => {
            await userInfoData.find({},{_id:0}).then((result0) => {
                res.send({ users: result0, message: result })
            })
        })
    }

    await checkForUpdatesAndSync()
    main()
})

// // used to register a new node on the network
app.post('/registerNode', async function (req, res) {
    const node = req.body.node
    await serverInfo.find({}).then(async(result) => {
        if (result[0].nodeList.includes(req.body.node)) {
            res.send({ message: result })
        } else {
            tempArr = []
            for (index in result[0].nodeList) {
                tempArr.push(result[0].nodeList[index])
            }

            tempArr.push(req.body.node)
            await serverInfo.update({nodeList: result[0].nodeList}, {$set: {nodeList: tempArr}}).then(() => {
                res.send({ message: result })
            })       
        }
    })
})

// // login
app.post('/login', async function (req, res) {
    const signedHash = req.body.security.signedHash
    const user = req.body.user
    const publicKey = req.body.publicKey
    const epoch = req.body.security.epoch

    await verdict(publicKey, signedHash, epoch, 'isAdmin').then(async(verdict) => {
        if (verdict) {
            if (Math.floor(+new Date() / 1000) >= epoch) {
                if (Math.floor(+new Date() / 1000)+600 >= parseInt(epoch)) {
                            
                    await userInfoData.find({publicKey: publicKey},{_id:0}).then(async(result) => {
                        if (result.length === 0) {
                            
                            await userInfoData.find({user: user},{_id:0}).then(async(result0) => {
                                if (result0.length === 0) {
                                    
                                    await userInfoData.count({}).then(async(result1) => {
                                        let isAdmin = false
                                        if (result1 === 0) { isAdmin = true }

                                        const payload = {
                                            user: user,
                                            publicKey: publicKey,
                                            img: "img",
                                            isAdmin: isAdmin
                                        }

                                        const data = await new userInfoData(payload);
                                        await data.save()

                                        await updateState().then(() => {
                                            res.send({ message: payload })
                                        })
                                    })

                                } else {
                                    res.send({ message: 'user already exists' })
                                }
                            })
                        } else {
                            res.send({ message: result })
                        }
                    })
                }
            }
        }
    })    
})

// // newChannel
app.post('/newChannel', async function (req, res) {
    const signedHash = req.body.security.signedHash
    const publicKey = req.body.security.publicKey
    const epoch = req.body.security.epoch
    const channelName = req.body.channelName

    async function main() {
        await verdict(publicKey, signedHash, epoch, 'isAdmin').then(async(verdict) => {
            if (verdict) {
                if (Math.floor(+new Date() / 1000) >= epoch) {
                    if (Math.floor(+new Date() / 1000)+600 >= parseInt(epoch)) {
                        await userInfoData.find({publicKey: publicKey},{_id:0}).then(async(isAdmin) => {
                            if (isAdmin[0].isAdmin) {
                                await messageAndChannelData.find({channelName: channelName},{_id:0}).then(async(result) => {
                                    if (result.length === 0) {
                                        
                                        const payload = {
                                            channelName: channelName,
                                            data: []
                                        }

                                        const data = await new messageAndChannelData(payload);
                                        await data.save()

                                        await updateState().then(() => {
                                            res.send({ message: result })
                                        })
                                        
                                    } else {
                                        res.status(400).send({ message: 'Error: Channel already exists, please select a new name' });
                                    }
                                })
                            } else {
    
                            }
                        })
                    }
                }
            }
        })
    }
    
    await checkForUpdatesAndSync()
    main()
})

// // newMessage
app.post('/newMessage', async function (req, res) {
    const signedHash = req.body.security.signedHash
    const publicKey = req.body.security.publicKey
    const epoch = req.body.security.epoch
    
    const channel = req.body.channel
    const user = req.body.user
    const msg = req.body.msg

    async function main() {
        await verdict(publicKey, signedHash, epoch, 'isAdmin').then(async(verdict) => {
            if (verdict) {
                if (Math.floor(+new Date() / 1000) >= epoch) {
                    if (Math.floor(+new Date() / 1000)+600 >= parseInt(epoch)) {
                        await messageAndChannelData.find({channelName: channel},{_id:0}).then(async(result) => {
                            if (result.length != 0) {
                                const payload = {
                                    user: user,
                                    date: moment().format('DD/MM @ hh:mm').toString().replace(0, ''),
                                    msg: msg
                                }
                            
                                const oldResult = JSON.parse(JSON.stringify(result))
                    
                                result[0].data.push(payload)
                                
                                await messageAndChannelData.update({channelName: result[0].channelName, data: oldResult[0].data}, {$set: {channelName: result[0].channelName, data: result[0].data}}).then(async(result0) => {            
                                    await updateState().then(() => {
                                        res.send({ message: result0 })
                                    })
                                })
                            } else {
                                res.status(400).send({ message: 'Error: Invalid Channel' });
                            }
                        })
                    }
                }
            }
        })
    }

    await checkForUpdatesAndSync()
    main()
})


app.listen(PORT, function() {
    console.log(`Node running on port: ${PORT}`);
})