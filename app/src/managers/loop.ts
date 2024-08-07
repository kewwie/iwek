import { KiwiClient } from "../client";
import { dataSource } from "../datasource";

import { GuildPluginEntity } from "../entities/GuildPlugin";
import { Loop } from "../types/loop";

export class LoopManager {
    private client: KiwiClient;

    constructor(client: KiwiClient) {
        this.client = client;
    }

    async load(loops: Loop[]) {
        const GuildPluginsRepository = await dataSource.getRepository(GuildPluginEntity);

        for (let loop of loops) {
            this.client.loops.set(loop.name, loop);

            setInterval(async () => {
                for (let [_, guild] of await this.client.guilds.fetch()) {
                    var g = await guild.fetch();

                    if (!loop.plugin.config.disableable) {
                        await loop.execute(this.client, g);
                    } else {
                        var isEnabled = await GuildPluginsRepository.findOne({ where: { guildId: g.id, pluginName: loop.plugin.config.name } });
                        if (isEnabled) {
                            await loop.execute(this.client, g);
                        }
                    }
                }
            }, loop.seconds * 1000);
        }
    }
};