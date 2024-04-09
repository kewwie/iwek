const {
	Client,
    GuildMember
} = require("discord.js");

module.exports = {
    name: "groupLeave",

    /**
    * 
    * @param {Client} client
    * @param {GuildMember} member
    */
    async execute(client, member, group) {
        group.members = group.members.filter(member => member !== user.id);
        await client.database.db("kiwi").collection("groups").updateOne(
            { _id: group._id },
            { $set: { members: group.members } }
        );

        const isMember = member.guild.members.cache.has(member.id);
        if (isMember) {
            await member.roles.remove(group.roleId);
        }
    }
}