import express from 'express';
import * as path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import axios from 'axios';
import Database from '@stuyk/ezmongodb';

import env from 'dotenv';
env.config();
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const MONGO_URL = process.env.MONGO_URL;
const WEBSERVER_IP = process.env.WEBSERVER_IP;

console.log(MONGO_URL);
// Connection URL. This is where your mongodb server is running.


const app = express();
const currentPath = path.join(process.cwd(), '/utility/webserver/files');
const port = 9111;
Database.init(MONGO_URL, 'athena', ['discords'])
    .catch(() => {
        MongoUtil.throwConnectionError();
    })
    .then((res) => {
        if (res) {
            console.log(`MongoDB connection was established.`);
            return;
        }

        MongoUtil.throwConnectionError();
    });
app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', express.static(currentPath));
app.get('/auth/redirect', async function (req, res) {
    let code = req.query.code;
    let dicordToken = req.query.state;
    const data_1 = new URLSearchParams();
    data_1.append('client_id', CLIENT_ID);
    data_1.append('client_secret', CLIENT_SECRET);
    data_1.append('grant_type', 'authorization_code');
    data_1.append('redirect_uri', `http://${WEBSERVER_IP}:9111/auth/redirect'`);
    data_1.append('scope', 'identify');
    data_1.append('code', code);
    let data = await fetch('https://discord.com/api/oauth2/token', { method: 'POST', body: data_1 }).then((response) =>
        response.json()
    );
    let info = await axios.get('https://discord.com/api/users/@me', make_config(data.access_token));
    let data_discord = info.data;
    data_discord.player_identifier = dicordToken;
    // Use connect method to connect to the server
    const document = await Database.insertData(data_discord, 'discords', true);
    document._id = document._id.toString(); // Re-cast id object as string.

    res.send('hello world');
});
app.listen(port, () => {
    console.log(`Started express server on: http://localhost:9111`);
    console.log(`Serving Files from: ${currentPath}`);
});
function make_config(authorization_token) {
    let data = {
        headers: {
            authorization: `Bearer ${authorization_token}`
        }
    };
    return data;
}
