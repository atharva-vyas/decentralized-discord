const express = require('express')
const app = express()
var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
PORT = 3001

const axios = require('axios').default;

const serverInitInfo = require('./serverInfo.json');
const randomNode = serverInitInfo[0].initialNodes

let nodes = []
for (indexNode in serverInitInfo[0].initialNodes) {
    nodes.push(serverInitInfo[0].initialNodes[indexNode])    
}
axios.get(randomNode[Math.floor(Math.random()*randomNode.length)] + '/state').then((result) => {
    for (index in result.data.nodeList) {
        if (!nodes.includes(result.data.nodeList[index])) {
            nodes.push(result.data.nodeList[index])            
        }
    }
})

var EC = require('elliptic').ec;
var ec = new EC('secp256k1');
const crypto = require('crypto');

function getHash(param) {
    const SHA256 = crypto.createHash('sha256').update(param).digest('hex');
    return SHA256
}

function signHash(data, privateKey) {
    const key = ec.keyFromPrivate(privateKey);
    
    const hashTx = getHash(data).toString()
    const sig = key.sign(hashTx, 'base64')
    return sig.toDER('hex')
}

function getPublicKeyFromPrivate(privateKey) {
    const key = ec.keyFromPrivate(privateKey);
    return key.getPublic('hex')
}

app.get('/state', function (req, res) {
    let index = nodes[Math.floor(Math.random() * nodes.length)]
    axios.get(index + '/state').then((result) => {
        res.send(result.data)
    }).catch((err) => {})
})

// // // login
app.post('/login', async function (req, res) {
    let respondeArr  = []
    for (index in nodes) {
        const user = req.body.user
        const pass = req.body.pass
        const privateKey = crypto.createHash('sha256').update(user+pass).digest('hex')
        const epoch = (Math.floor(+new Date() / 1000)).toString()

        const payload = {
            security: { signedHash: signHash(epoch, privateKey), epoch: epoch },
            user: user,
            publicKey: getPublicKeyFromPrivate(privateKey),
            img: null,
        }
        
        try {
            const result = await axios.post(nodes[index] + '/login', payload)
            if (result.data.message[0].user && result.data.message[0].img && result.data.message[0].publicKey) {
                respondeArr.push(result.data.message[0])
            }
        } catch {}
    }
    res.send({ message: [respondeArr[Math.floor(Math.random()*respondeArr.length)]] })
})

// // getData
let tempData
let timeout = Math.floor(+new Date() / 1000)
app.get('/getData', function (req, res) {
    let index = nodes[Math.floor(Math.random() * nodes.length)]

    if (Math.floor(+new Date() / 1000) >= timeout) {
        axios.get(index + '/getData').then((result) => {
            tempData = result.data
            timeout = timeout + 2
            res.send(tempData)
        }).catch((err) => {
            res.send(tempData)
        })
    } else {
        res.send(tempData)
    }
})

// // newChannel
app.post('/newChannel', async function (req, res) {
    let respondeArr  = []
    for (index in nodes) {
    
        const user = req.body.username
        const pass = req.body.password
        const privateKey = crypto.createHash('sha256').update(user+pass).digest('hex')
        const epoch = (Math.floor(+new Date() / 1000)).toString()

        const channelName = req.body.channelName

        const payload = {
            security: { 
                signedHash: signHash(epoch, privateKey), 
                publicKey: getPublicKeyFromPrivate(privateKey), 
                epoch: epoch
            },
            channelName: channelName
        }
        
        try {
            const result = await axios.post(nodes[index] + '/newChannel', payload)
            respondeArr.push(result.data)
        } catch {}
    }
    res.send(respondeArr[Math.floor(Math.random()*respondeArr.length)])
})

// // newMessage
app.post('/newMessage', async function (req, res) {
    let respondeArr  = []
    for (index in nodes) {
        const user = req.body.username
        const pass = req.body.password
        const privateKey = crypto.createHash('sha256').update(user+pass).digest('hex')
        const epoch = (Math.floor(+new Date() / 1000)).toString()

        const channel = req.body.channel
        const msg = req.body.msg

        const payload = {
            security: { 
                signedHash: signHash(epoch, privateKey), 
                publicKey: getPublicKeyFromPrivate(privateKey), 
                epoch: epoch
            },
            channel: channel,
            user: user,
            msg: msg
        }
        
        try {
            const result = await axios.post(nodes[index] + '/newMessage', payload)
            respondeArr.push(result.data)
        } catch {}
    }
    res.send(respondeArr[Math.floor(Math.random()*respondeArr.length)])
})



app.listen(PORT, function() {
    console.log(`Middleware running on port: ${PORT}`);
})