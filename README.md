# decentralized-discord
This is a decentralized messaging application similar to discord/slack. The backend uses a custom built blockchain to share and sync mesaages across the network

<b>
        <h1>How to create your own server:-</h1>
</b>
        <ol>
                <li>docker pull atharvavyas/decentralized-discord-node-server</li>
                <li>docker run -t -d -p 1000(or any other free port):3003 --name nodeServer atharvavyas/decentralized-discord-node-server</li>
                <li>docker ps -a</li>
                <li>docker start {container_id}</li>
                <li>docker exec -it nodeServer bash</li>
                <li>cd home</li> 
                <li>nano serverInit.json</li>
                <br/>
                <li>replace the myUrl variable with the address/url of your server/node</li>
                <li>if you are are planning to add additional nodes(which you should), then add their url's/address's in the initialNodes array</li>
                <li>also replace the serverName with a name of your preference</li>
                <li>close, and save the file</li> 
                <br/>
                <li>npx nodemon</li> 
        </ol>
        to check if the server is running, go to http://localhost:{your free port from step-2}/state <br/>
        and you should be able to see a json with your servername, and various other info

<b>
        <h1>How to join a server:- </h1>(i know its a bit cumbersome for now)
</b>
        <ol>
                <li>open backend/middleware/serverInfo.json</li>
                <li>replace the initialNodes array contents, with the url/s of the server/node you want to connect to.</li>
                <li>go to /backend/middleware/ and run index.js</li>
                <li>go to /frontend/ and run npm start, and try logging in</li>
        </ol>

<b>
        <h1>PLEASE NOTE:-</h1>
</b>
<ul>
        <li>the first user to login, will automatically become the admin, and for now you can only have one admin. also only a admin can add new channels</li>
        <li>this is a barebones proof-of-concept testbed, ontop of which you can keep on adding additional features</li>
        <li>this does not use matrix. It uses a custom blockchain architecture to sync and share data</li>
        <li>this was made in around a week, so expect some bugs & performance issues</li>
</ul>


![570e0dc6-a84b-493c-821d-a04659431e32 sketchpad(7)](https://user-images.githubusercontent.com/85245060/224798462-226af03d-1d05-4712-b9ef-1b081c3e4e7f.png)
