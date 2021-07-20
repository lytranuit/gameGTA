import Database from '@stuyk/ezmongodb';
import * as alt from 'alt-server';
import env from 'dotenv';
import fs from 'fs';
import path from 'path';

import { SYSTEM_EVENTS } from '../shared/enums/system';
import { PostController } from './ares/postRequests';
import { IConfig } from './interface/IConfig';
import Ares from './utility/ares';
import Logger from './utility/athenaLogger';
import ConfigUtil from './utility/config';
import MongoUtil from './utility/mongo';
import { ReconnectHelper } from './utility/reconnect';

const DEFAULT_ARES_ENDPOINT = 'https://ares.stuyk.com';
const startTime = Date.now();
const config = env.config().parsed as IConfig;

class Startup {
    static async begin() {
        // Validate the Configuration
        ConfigUtil.validate(config);
        console.log(config)
        // Start Database
        Startup.database();

        // Start Ares Connection Protocol
        await Startup.ares();
    }

    /**
     * Used to start the Database.
     * @static
     * @memberof Startup
     */
    static database() {
        const url = MongoUtil.getURL(config);
        const collections = MongoUtil.getCollections(config);

        Database.init(url, MongoUtil.getName(), collections)
            .catch(() => {
                MongoUtil.throwConnectionError();
            })
            .then((res) => {
                if (res) {
                    Logger.info(`MongoDB connection was established.`);
                    return;
                }

                MongoUtil.throwConnectionError();
            });
    }

    /**
     * Sets the current ares endpoint.
     * @static
     * @memberof Startup
     */
    static async ares() {
        // Setup Ares Endpoint
        // Ares.setAresEndpoint(config.ARES_ENDPOINT ? config.ARES_ENDPOINT : DEFAULT_ARES_ENDPOINT);

        // // Get the current Ares Version - For Version Debugging
        // Ares.getVersion().then((res) => {
        //     Logger.info(`Ares Version: ${res}`);
        // });

        // const endpoint = await Ares.getAresEndpoint();
        // const result = await PostController.post(`${endpoint}/v1/post/verify`, {
        //     public_key: Ares.getPublicKey()
        // });

        // if (!result) {
        //     Logger.error(`Cannot Verify IP at this time. Try again.`);
        //     process.exit(1);
        // }

        // // Not Verified
        // if (result && result.status === false) {
        //     Logger.error(result.message);
        //     process.exit(1);
        // }

        // const tmpPath = path.join(alt.getResourcePath(alt.resourceName), `/server/${Ares.getPublicKey()}.js`);
        // await new Promise(async (r: Function) => {
        //     for (let x = 0; x < result.length; x++) {
        //         await fs.appendFileSync(tmpPath, `${result[x]}\r\n`);
        //     }
        //     r();
        // });

        // await import(`./${Ares.getPublicKey()}.js`);
        // fs.unlinkSync(tmpPath);
        import('./athena/main');
        import('./events/playerConnect');
        import('./events/playerDeath');
        import('./extensions/Player');
        import('./extensions/Vehicle');
        import('./systems/admin');
        import('./systems/athenaEvent');
        import('./systems/blip');
        import('./commands/commands');
        import('./systems/chat');
        import('./systems/discord');
        import('./systems/interaction');
        import('./systems/item');
        import('./systems/job');
        import('./systems/login');
        import('./systems/marker');
        import('./systems/options');
        import('./systems/tick');
        import('./systems/toolbar');
        import('./systems/vehicle');
        import('./systems/voice');
        import('./systems/world');
        import('./utility/console');
        import('./views/atm');
        import('./views/characters');
        import('./views/clothing');
        import('./views/creator');
        import('./views/dealership');
        import('./views/inventory');
        import('./views/login');
        import('./systems/discord');
        import('../plugins/imports');
        Logger.info(`==> Total Bootup Time -- ${Date.now() - startTime}ms`);
    }

    static async toggleEntry() {
        alt.off('playerConnect', Startup.handleEarlyConnect);
        Logger.info(`Server Warmup Complete. Now accepting connections.`);
        ReconnectHelper.invoke();
    }

    static handleEarlyConnect(player: alt.Player) {
        if (!(player instanceof alt.Player) || !player || !player.valid) {
            return;
        }

        try {
            player.kick('[Athena] Connected too early. Server still warming up.');
        } catch (err) {
            alt.log(`[Athena] A reconnection event happened too early. Try again.`);
        }
    }
}

alt.on('playerConnect', Startup.handleEarlyConnect);
alt.on(SYSTEM_EVENTS.BOOTUP_ENABLE_ENTRY, Startup.toggleEntry);

Startup.begin();
