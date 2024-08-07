import {
    ChatInputCommandInteraction,
    AutocompleteInteraction,
    EmbedBuilder,
    resolveColor,
    ColorResolvable,
    ActionRowBuilder,
    ButtonBuilder
} from "discord.js";

import { 
    CommandTypes,
    SlashCommandContexts,
    IntegrationTypes,
    OptionTypes,
    SlashCommand
} from "../../../types/command";
import { KiwiClient } from "../../../client";

import { dataSource } from "../../../datasource";
import { GuildGroupEntity } from "../../../entities/GuildGroup";
import { GroupMemberEntity } from "../../../entities/GroupMember";
import { GroupInviteEntity } from "../../../entities/GroupInvite";
import { GuildUserEntity } from "../../../entities/GuildUser";

import { AcceptInvite } from "../buttons/accept-invite";
import { DenyInvite } from "../buttons/deny-invite";

/**
 * @type {SlashCommand}
 */
export const GroupCommand: SlashCommand =  {
	config: {
        name: "group",
        description: "Group Commands",
        type: CommandTypes.CHAT_INPUT,
        default_member_permissions: null,
        contexts: [SlashCommandContexts.GUILD],
        integration_types: [IntegrationTypes.GUILD],
        options: [
            {
                type: OptionTypes.SUB_COMMAND,
                name: "create",
                description: "Create a group",
                options: [
                    {
                        type: OptionTypes.STRING,
                        name: "name",
                        description: "Name of the group",
                        required: true
                    }
                ]
            },
            {
                type: OptionTypes.SUB_COMMAND,
                name: "join",
                description: "Join a group",
                options: [
                    {
                        type: OptionTypes.STRING,
                        name: "name",
                        description: "Name of the group",
                        autocomplete: true,
                        required: true
                    }
                ]
            },
            {
                type: OptionTypes.SUB_COMMAND,
                name: "leave",
                description: "Leave a group",
                options: [
                    {
                        type: OptionTypes.STRING,
                        name: "name",
                        description: "Name of the group",
                        autocomplete: true,
                        required: true
                    }
                ]
            },
            {
                type: OptionTypes.SUB_COMMAND,
                name: "invite",
                description: "Invite a user to a group",
                options: [
                    {
                        type: OptionTypes.STRING,
                        name: "name",
                        description: "Name of the group",
                        autocomplete: true,
                        required: true
                    },
                    {
                        type: OptionTypes.USER,
                        name: "user",
                        description: "The user to invite to the group",
                        required: true
                    }
                ]
            },
            {
                type: OptionTypes.SUB_COMMAND,
                name: "kick",
                description: "Kick a user from a group",
                options: [
                    {
                        type: OptionTypes.STRING,
                        name: "name",
                        description: "Name of the group",
                        autocomplete: true,
                        required: true
                    },
                    {
                        type: OptionTypes.USER,
                        name: "user",
                        description: "The user to remove from the group",
                        required: true
                    }
                ]
            },
            {
                type: OptionTypes.SUB_COMMAND,
                name: "add",
                description: "Add a user to a group",
                options: [
                    {
                        type: OptionTypes.STRING,
                        name: "name",
                        description: "Name of the group",
                        autocomplete: true,
                        required: true
                    },
                    {
                        type: OptionTypes.USER,
                        name: "user",
                        description: "The user to add to the group",
                        required: true
                    }
                ]
            },
            {
                type: OptionTypes.SUB_COMMAND,
                name: "privacy",
                description: "Change the privacy of the group",
                options: [
                    {
                        type: OptionTypes.STRING,
                        name: "name",
                        description: "Name of the group",
                        autocomplete: true,
                        required: true
                    },
                    {
                        type: OptionTypes.STRING,
                        name: "private",
                        description: "true or false",
                        choices: [
                            { name: "True", value: "true" },
                            { name: "False", value: "false" }
                        ],
                        required: true
                    }
                ]
            },         
            {
                type: OptionTypes.SUB_COMMAND,
                name: "list",
                description: "Lists all groups"
            },
            {
                type: OptionTypes.SUB_COMMAND,
                name: "info",
                description: "Info about a group",
                options: [
                    {
                        type: OptionTypes.STRING,
                        name: "name",
                        description: "Name of the group",
                        autocomplete: true,
                        required: true
                    }
                ]
            },
            {
                type: OptionTypes.SUB_COMMAND,
                name: "delete",
                description: "Delete a group",
                options: [
                    {
                        type: OptionTypes.STRING,
                        name: "name",
                        description: "Name of the group",
                        autocomplete: true,
                        required: true
                    }
                ]
            }
        ]
    },

    /**
     * @param {AutocompleteInteraction} interaction
     * @param {KiwiClient} client
     */
    async autocomplete(interaction: AutocompleteInteraction, client: KiwiClient) {
        const GuildGroupRepository = await dataSource.getRepository(GuildGroupEntity);
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const choices = await GuildGroupRepository.find({ where: { guildId: interaction.guild.id } });
		const filtered = choices.filter(choice => choice.groupName.toLowerCase().startsWith(focusedValue));
		await interaction.respond(
			filtered.map(choice => ({ name: choice.groupName, value: choice.groupName })),
		);
    },

	/**
    * @param {ChatInputCommandInteraction} interaction
    * @param {KiwiClient} client
    */
	async execute(interaction: ChatInputCommandInteraction, client: KiwiClient) {
        const GuildGroupRepository = await dataSource.getRepository(GuildGroupEntity);
        const GroupMemberRepository = await dataSource.getRepository(GroupMemberEntity);
        const GroupInviteRepository = await dataSource.getRepository(GroupInviteEntity);
        const GuildUserRepository = await dataSource.getRepository(GuildUserEntity);
        
        switch (interaction.options.getSubcommand()) {
            case "create": {
                var name = interaction.options.getString('name');

                var isStaff = (await GuildUserRepository.findOne({ where: { guildId: interaction.guild.id, userId: interaction.user.id } })).level >= 2;

                if (!isStaff) {
                    interaction.reply("You do not have permission to create a group");
                    return; 
                }

                var existingGroup = await GuildGroupRepository.findOne(
                    {
                        where: {
                            guildId: interaction.guild.id,
                            groupName: name
                        }
                    }
                )

                if (existingGroup) {
                    interaction.reply("Group already exists");
                    return;
                }
                var role = await interaction.guild.roles.create({
                    name: `Group ${name}`,
                    color: "Random",
                    mentionable: true
                });

                await interaction.guild.members.cache.get(interaction.member.user.id).roles.add(role).catch(() => {});

                var groupId = String(Date.now() - 1000);

                await GuildGroupRepository.insert({
                    groupId,
                    groupName: name,
                    guildId: interaction.guild.id,
                    roleId: role.id,
                    ownerId: interaction.user.id,
                    private: false
                });

                await GroupMemberRepository.insert({
                    groupId,
                    userId: interaction.user.id,
                    userName: interaction.user.username
                });

                interaction.reply(`Group **${name}** has been created`);
                break;
            }
    
            case "join": {
                var name = interaction.options.getString('name');

                const existingGroup = await GuildGroupRepository.findOne({
                    where: {
                        guildId: interaction.guild.id,
                        groupName: name
                    }
                });

                if (existingGroup) {
                    var isAdmin = (await GuildUserRepository.findOne({ where: { guildId: interaction.guild.id, userId: interaction.user.id } })).level >= 3;

                    if (existingGroup.private && !isAdmin) {
                        interaction.reply("This group is private");
                        return;
                    }

                    const groupMember = await GroupMemberRepository.findOne({
                        where: { groupId: existingGroup.groupId, userId: interaction.user.id }
                    });

                    if (groupMember) {
                        interaction.reply("You are already a member of this group");
                        return;
                    }
                    await interaction.guild.members.cache.get(interaction.user.id).roles.add(existingGroup.roleId).catch(() => {});

                    await GroupMemberRepository.insert({
                        groupId: existingGroup.groupId,
                        userId: interaction.user.id,
                        userName: interaction.user.username
                    });
                    interaction.reply(`You have joined the group **${name}**`);
                } else {
                    interaction.reply("Group does not exist");
                }
                break;
            }

            case "leave": {
                var name = interaction.options.getString('name');

                const existingGroup = await GuildGroupRepository.findOne({
                    where: {
                        guildId: interaction.guild.id,
                        groupName: name
                    }
                });

                if (existingGroup) {
                    if (existingGroup.ownerId === interaction.user.id) {
                        interaction.reply("You cannot leave a group you own");
                        return;
                    }

                    const groupMember = await GroupMemberRepository.findOne({ 
                        where: { groupId: existingGroup.groupId, userId: interaction.user.id }
                    });

                    if (groupMember) {
                        await interaction.guild.members.cache.get(interaction.user.id).roles.remove(existingGroup.roleId).catch(() => {});
                        
                        await GroupMemberRepository.delete({ groupId: existingGroup.groupId, userId: interaction.user.id })
                        interaction.reply(`You have left the group **${name}**`);
                    } else {
                        interaction.reply(`You are not a member of the group **${name}**`);
                    }
                } else {
                    interaction.reply(`The group **${name}** does not exist`);
                }
                break;
            }

            case "invite": {
                var name = interaction.options.getString('name');
                var user = interaction.options.getUser('user');

                const existingGroup = await GuildGroupRepository.findOne({
                    where: {
                        guildId: interaction.guild.id,
                        groupName: name
                    }
                });

                if (user.bot) {
                    interaction.reply("Bots cannot be added to groups");
                    return;
                }

                if (existingGroup) {
                    var group = await GuildGroupRepository.findOne({ where: { groupId: existingGroup.groupId }});
                    var groupMembers = await GroupMemberRepository.find({ where: { groupId: existingGroup.groupId }});
                    
                    if (!groupMembers.find(member => member.userId === interaction.user.id)) {
                        interaction.reply(`You do not have permission to invite members to group **${name}**`);
                        return;
                    }
                
                    if (groupMembers.find(member => member.userId === user.id)) {
                        interaction.reply(`**${user.username}** is already a member of group **${name}**`);
                        return;
                    }

                    if (await GroupInviteRepository.findOne({ where: { groupId: existingGroup.groupId, userId: user.id }})) {
                        interaction.reply(`**${user.username}** has already been invited to group **${name}**`);
                        return;
                    }

                    var rows = new Array();

                    rows.push(new ActionRowBuilder()
                        .addComponents([
                            new ButtonBuilder(AcceptInvite.config)
                                .setCustomId("accept-invite_" + user.id),
                            new ButtonBuilder(DenyInvite.config)
                                .setCustomId("deny-invite_" + user.id)
                    ]));

                    var message = await user.send({
                        content: `You have been invited to the group **${name}** by **${interaction.user.username}** in **${interaction.guild.name}**.`,
                        components: rows
                    }).catch(() => {
                        interaction.reply("I was unable to send a DM to the user");
                    });

                    if (!message) return;

                    await GroupInviteRepository.insert({
                        groupId: existingGroup.groupId,
                        userId: user.id,
                        inviterId: interaction.user.id,
                        messageId: message.id,
                        createdAt: new Date()
                    });
                    interaction.reply(`**${user.username}** has been invited to group **${name}**`);
        
                } else {
                    interaction.reply(`Group **${name}** does not exist`);
                }
                break;
            }

            case "kick": {
                var name = interaction.options.getString('name');
                var user = interaction.options.getUser('user');

                const existingGroup = await GuildGroupRepository.findOne({
                    where: {
                        guildId: interaction.guild.id,
                        groupName: name
                    }
                });

                if (existingGroup) {
                    if (existingGroup.ownerId === user.id) {
                        interaction.reply("You cannot remove the owner of the group");
                        return;
                    }

                    if (existingGroup.ownerId !== interaction.user.id) {
                        interaction.reply(`You do not have permission to remove members from group **${name}**`);
                        return;
                    }

                    const groupMember = await GroupMemberRepository.findOne({ where: { groupId: existingGroup.groupId, userId: user.id }});
                    if (groupMember) {
                        interaction.guild.members.cache.get(user.id).roles.remove(existingGroup.roleId).catch(() => {});
                        GroupMemberRepository.delete({ groupId: existingGroup.groupId, userId: user.id })
                        interaction.reply(`**${user.username}** has been removed from group **${name}**`);
                    } else {
                        interaction.reply(`**${user.username}** is not a member of group **${name}**`);
                    }
                } else {
                    interaction.reply(`Group **${name}** does not exist`);
                }
                break;
            }

            case "add": {
                var name = interaction.options.getString('name');
                var user = interaction.options.getUser('user');

                const existingGroup = await GuildGroupRepository.findOne({
                    where: {
                        guildId: interaction.guild.id,
                        groupName: name
                    }
                });

                if (existingGroup) {
                    var isAdmin = (await GuildUserRepository.findOne({ where: { guildId: interaction.guild.id, userId: interaction.user.id } })).level >= 3;

                    if (!isAdmin) {
                        interaction.reply("You do not have permission to add members to a group");
                        return;
                    }

                    if (user.bot) {
                        interaction.reply("Bots cannot be added to groups");
                        return;
                    }

                    var groupMember = await GroupMemberRepository.findOne({ where: { groupId: existingGroup.groupId, userId: user.id }});
                    if (groupMember) {
                        interaction.reply(`**${user.username}** is already a member of group **${name}**`);
                        return;
                    }

                    interaction.guild.members.cache.get(user.id).roles.add(existingGroup.roleId).catch(() => {});
                    GroupMemberRepository.insert({
                        groupId: existingGroup.groupId,
                        userId: user.id,
                        userName: user.username
                    });

                    interaction.reply(`**${user.username}** has been added to group **${name}**`);
                }
                break;
            }

            case "privacy": {
                var name = interaction.options.getString('name');
                var isPrivate = interaction.options.getString('private');

                const existingGroup = await GuildGroupRepository.findOne({
                    where: {
                        guildId: interaction.guild.id,
                        groupName: name
                    }
                });

                if (existingGroup) {
                    var group = await GuildGroupRepository.findOne({ where: { groupId: existingGroup.groupId }});
                    if (group.ownerId !== interaction.user.id) {
                        interaction.reply(`You do not have permission to change the privacy of the group **${name}**`);
                        return;
                    }

                    GuildGroupRepository.update({ groupId: existingGroup.groupId }, { private: (isPrivate === "true") });
                    interaction.reply(`Group **${name}** privacy has been updated`);
                } else {
                    await interaction.reply("This group doesnt exist");
                }
                break;
            }

            case "delete": {
                var name = interaction.options.getString('name');

                const existingGroup = await GuildGroupRepository.findOne({
                    where: {
                        guildId: interaction.guild.id,
                        groupName: name
                    }
                });

                if (existingGroup) {
                    if (existingGroup.ownerId !== interaction.user.id) {
                        interaction.reply("You are not the owner of this group");
                        return;
                    }

                    const role = interaction.guild.roles.cache.get(existingGroup.roleId);
                    if (role) {
                        role.delete();
                    }

                    GuildGroupRepository.delete({ guildId: interaction.guild.id, groupId: existingGroup.groupId });
                    GroupMemberRepository.delete({ groupId: existingGroup.groupId });
                    interaction.reply(`Group **${name}** has been deleted`);
                } else {
                    interaction.reply("This group doesnt exist");
                }
                break;
            }

            case "list": {
                const groups = await GuildGroupRepository.find({ where: { guildId: interaction.guild.id } });
                if (groups.length > 0) {
                    interaction.reply(`# Groups \n**${groups.map(group => group.groupName).join("\n")}**`);
                } else {
                    interaction.reply("There are no groups in this guild");
                }
                break;
            }

            case "info": {
                var name = interaction.options.getString('name');

                const existingGroup = await GuildGroupRepository.findOne({
                    where: {
                        guildId: interaction.guild.id,
                        groupName: name
                    }
                });

                if (existingGroup) {
                    const groupMembers = await GroupMemberRepository.find({ where: { groupId: existingGroup.groupId } });

                    var em = new EmbedBuilder()
                        .setTitle("Group " + existingGroup.groupName)
                        .addFields(
                            { name: "Owner", value: `<@${existingGroup.ownerId}>` },
                            { name: "Members", value: groupMembers.map(member => `${member.userName}`).join(", ") },
                            { name: "Private", value: existingGroup.private ? "Yes" : "No" }
                        )
                        .setColor(client.embed.color)
                        .setTimestamp();

                    interaction.reply({ embeds: [em] });
                } else {
                    interaction.reply("Group does not exist");
                }
                break;
            }
        }
	},
}