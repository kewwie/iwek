import { KiwiClient } from "../client";
import { Event } from "../types/event";

import { dataSource } from "../datasource";
import { GuildPluginEntity } from "../entities/GuildPlugin";

export class EventManager {
    private client: KiwiClient;

    constructor(client: KiwiClient) {
        this.client = client;
    }

    load(events: Event[]) {
        for (let event of events) {
            this.client.events.set(event.name, event);

            this.client.on(event.name, async (...args: any[]) => {
                if (event.plugin.config.disableable) {
                    const GuildPluginsRepository = await dataSource.getRepository(GuildPluginEntity);
                    if (await GuildPluginsRepository.findOne({ where: { guildId: (await event.getGuildId(...args)), pluginName: event.plugin.config.name } })) {
                        event.execute(this.client, ...args);
                    }
                } else {
                    event.execute(this.client, ...args);
                }
            });
        }
    }
};