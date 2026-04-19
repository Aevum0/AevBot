const {
  Client, GatewayIntentBits, EmbedBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder, PermissionFlagsBits, ChannelType,
  AuditLogEvent
} = require('discord.js');

const TOKEN = process.env.TOKEN;
const WELCOME_CHANNEL_ID = '1488713959564509214';
const STAFF_ROLE = '1495431128893358090';
const SUPPORT_CATEGORY = '1488725995698651318';
const BUY_CATEGORY = '1488727140085006437';
const LOG_CHANNEL = '1488759192142741625';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
  ]
});

client.once('clientReady', () => {
  console.log(`${client.user.tag} is online`);
});

// Helper: send log
function sendLog(guild, embed) {
  const channel = guild.channels.cache.get(LOG_CHANNEL);
  if (channel) channel.send({ embeds: [embed] });
}

// Helper: staff check
function isStaff(member) {
  return member.roles.cache.has(STAFF_ROLE);
}

// Helper: get or create Muted role
async function getMutedRole(guild) {
  let role = guild.roles.cache.find(r => r.name === 'Muted');
  if (!role) {
    role = await guild.roles.create({ name: 'Muted', permissions: [] });
    guild.channels.cache.forEach(async (channel) => {
      await channel.permissionOverwrites.create(role, {
        SendMessages: false,
        Speak: false,
      }).catch(() => {});
    });
  }
  return role;
}

// Join
client.on('guildMemberAdd', async (member) => {
  await member.roles.add(ROLE_ID).catch(console.error);

  const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
  if (channel) {
    const embed = new EmbedBuilder()
      .setColor(0x000000)
      .setAuthor({ name: member.user.username, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
      .setTitle('Welcome to Aevum | Development')
      .setDescription(`**${member.user.username}**\n\nThis server was custom-built for Aevum's clients and projects.`)
      .setThumbnail(member.user.displayAvatarURL({ size: 256, dynamic: true }))
      .setTimestamp()
      .setFooter({ text: 'Aevum | Development' });
    channel.send({ embeds: [embed] });
  }

  sendLog(member.guild, new EmbedBuilder()
    .setColor(0x00cc00)
    .setTitle('Member Joined')
    .setDescription(`**${member.user.tag}** joined the server.`)
    .addFields({ name: 'ID', value: member.user.id })
    .setTimestamp()
    .setFooter({ text: 'Aevum | Development' })
  );
});

// Leave
client.on('guildMemberRemove', async (member) => {
  const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
  if (channel) {
    const embed = new EmbedBuilder()
      .setColor(0xffffff)
      .setAuthor({ name: member.user.username, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
      .setTitle('See You Later')
      .setDescription(`**${member.user.username}**`)
      .setThumbnail(member.user.displayAvatarURL({ size: 256, dynamic: true }))
      .setTimestamp()
      .setFooter({ text: 'Aevum | Development' });
    channel.send({ embeds: [embed] });
  }

  sendLog(member.guild, new EmbedBuilder()
    .setColor(0xff6600)
    .setTitle('Member Left')
    .setDescription(`**${member.user.tag}** left the server.`)
    .addFields({ name: 'ID', value: member.user.id })
    .setTimestamp()
    .setFooter({ text: 'Aevum | Development' })
  );
});

// Message Delete
client.on('messageDelete', async (message) => {
  if (message.author?.bot) return;
  sendLog(message.guild, new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle('Message Deleted')
    .addFields(
      { name: 'Author', value: message.author?.tag || 'Unknown', inline: true },
      { name: 'Channel', value: `<#${message.channel.id}>`, inline: true },
      { name: 'Content', value: message.content || '*No content*' }
    )
    .setTimestamp()
    .setFooter({ text: 'Aevum | Development' })
  );
});

// Message Edit
client.on('messageUpdate', async (oldMessage, newMessage) => {
  if (oldMessage.author?.bot) return;
  if (oldMessage.content === newMessage.content) return;
  sendLog(oldMessage.guild, new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle('Message Edited')
    .addFields(
      { name: 'Author', value: oldMessage.author?.tag || 'Unknown', inline: true },
      { name: 'Channel', value: `<#${oldMessage.channel.id}>`, inline: true },
      { name: 'Before', value: oldMessage.content || '*No content*' },
      { name: 'After', value: newMessage.content || '*No content*' }
    )
    .setTimestamp()
    .setFooter({ text: 'Aevum | Development' })
  );
});

// Ban
client.on('guildBanAdd', async (ban) => {
  sendLog(ban.guild, new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle('Member Banned')
    .addFields(
      { name: 'User', value: ban.user.tag, inline: true },
      { name: 'ID', value: ban.user.id, inline: true },
      { name: 'Reason', value: ban.reason || 'No reason provided.' }
    )
    .setTimestamp()
    .setFooter({ text: 'Aevum | Development' })
  );
});

// Unban
client.on('guildBanRemove', async (ban) => {
  sendLog(ban.guild, new EmbedBuilder()
    .setColor(0x00cc00)
    .setTitle('Member Unbanned')
    .addFields(
      { name: 'User', value: ban.user.tag, inline: true },
      { name: 'ID', value: ban.user.id, inline: true }
    )
    .setTimestamp()
    .setFooter({ text: 'Aevum | Development' })
  );
});

// Commands
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const args = message.content.trim().split(/ +/);
  const command = args[0].toLowerCase();

  // !ticketpanel
  if (command === '!ticketpanel') {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

    const embed = new EmbedBuilder()
      .setColor(0x000000)
      .setTitle('Open a Ticket')
      .setDescription('Have a question or want to make a purchase? Open a ticket to get quick support.\n\n- Only staff and you can see the ticket.\n- Provide as much detail as possible.\n- Close the ticket when you are done.');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_support').setLabel('Support').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('ticket_buy').setLabel('Buy').setStyle(ButtonStyle.Secondary),
    );

    await message.channel.send({ embeds: [embed], components: [row] });
    message.delete().catch(() => {});
  }

  // !close
  if (command === '!close') {
    if (!message.channel.name.startsWith('ticket-') && !message.channel.name.startsWith('buy-')) return;
    await message.channel.send('Closing ticket...');
    setTimeout(() => message.channel.delete().catch(console.error), 3000);
  }

  // --- STAFF ONLY ---
  if (!isStaff(message.member)) return;

  // !staffhelp
  if (command === '!staffhelp') {
    const embed = new EmbedBuilder()
      .setColor(0x000000)
      .setTitle('AevBot — Staff Commands')
      .addFields(
        { name: 'Ticket', value: '`!close` — Close the current ticket' },
        { name: 'Moderation', value: [
          '`!ban @user [reason]` — Ban a user',
          '`!kick @user [reason]` — Kick a user',
          '`!mute @user` — Mute a user',
          '`!unmute @user` — Unmute a user',
          '`!timeout @user <minutes>` — Timeout a user',
          '`!del <1-100>` — Delete messages',
          '`!slowmode <seconds>` — Set slowmode',
          '`!slowmodeoff` — Disable slowmode',
          '`!lock` — Lock the channel',
          '`!unlock` — Unlock the channel',
        ].join('\n') },
        { name: 'Admin', value: [
          '`!ticketpanel` — Send the ticket panel',
          '`!delallc` — Delete all channels',
          '`!delallr` — Delete all roles',
          '`!alluser <roleID>` — Set all users to one role',
          '`!kickalluser` — Kick all users (except owner)'
        ].join('\n') }
      )
      .setFooter({ text: 'Aevum | Development' })
      .setTimestamp();
    message.channel.send({ embeds: [embed] });
  }

  // !ban @user [reason]
  if (command === '!ban') {
    const target = message.mentions.members.first();
    if (!target) return message.reply('Please mention a user.');
    const reason = args.slice(2).join(' ') || 'No reason provided.';
    await target.ban({ reason }).catch(console.error);
    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('User Banned')
      .addFields(
        { name: 'User', value: target.user.tag, inline: true },
        { name: 'Moderator', value: message.author.tag, inline: true },
        { name: 'Reason', value: reason }
      )
      .setTimestamp()
      .setFooter({ text: 'Aevum | Development' });
    message.channel.send({ embeds: [embed] });
  }

  // !kick @user [reason]
  if (command === '!kick') {
    const target = message.mentions.members.first();
    if (!target) return message.reply('Please mention a user.');
    const reason = args.slice(2).join(' ') || 'No reason provided.';
    await target.kick(reason).catch(console.error);
    const embed = new EmbedBuilder()
      .setColor(0xff6600)
      .setTitle('User Kicked')
      .addFields(
        { name: 'User', value: target.user.tag, inline: true },
        { name: 'Moderator', value: message.author.tag, inline: true },
        { name: 'Reason', value: reason }
      )
      .setTimestamp()
      .setFooter({ text: 'Aevum | Development' });
    message.channel.send({ embeds: [embed] });

    sendLog(message.guild, new EmbedBuilder()
      .setColor(0xff6600)
      .setTitle('Member Kicked')
      .addFields(
        { name: 'User', value: target.user.tag, inline: true },
        { name: 'Moderator', value: message.author.tag, inline: true },
        { name: 'Reason', value: reason }
      )
      .setTimestamp()
      .setFooter({ text: 'Aevum | Development' })
    );
  }

  // !mute @user
  if (command === '!mute') {
    const target = message.mentions.members.first();
    if (!target) return message.reply('Please mention a user.');
    const mutedRole = await getMutedRole(message.guild);
    await target.roles.add(mutedRole).catch(console.error);
    const embed = new EmbedBuilder()
      .setColor(0x888888)
      .setTitle('User Muted')
      .addFields(
        { name: 'User', value: target.user.tag, inline: true },
        { name: 'Moderator', value: message.author.tag, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Aevum | Development' });
    message.channel.send({ embeds: [embed] });

    sendLog(message.guild, new EmbedBuilder()
      .setColor(0x888888)
      .setTitle('Member Muted')
      .addFields(
        { name: 'User', value: target.user.tag, inline: true },
        { name: 'Moderator', value: message.author.tag, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Aevum | Development' })
    );
  }

  // !unmute @user
  if (command === '!unmute') {
    const target = message.mentions.members.first();
    if (!target) return message.reply('Please mention a user.');
    const mutedRole = await getMutedRole(message.guild);
    await target.roles.remove(mutedRole).catch(console.error);
    const embed = new EmbedBuilder()
      .setColor(0x00cc00)
      .setTitle('User Unmuted')
      .addFields(
        { name: 'User', value: target.user.tag, inline: true },
        { name: 'Moderator', value: message.author.tag, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Aevum | Development' });
    message.channel.send({ embeds: [embed] });

    sendLog(message.guild, new EmbedBuilder()
      .setColor(0x00cc00)
      .setTitle('Member Unmuted')
      .addFields(
        { name: 'User', value: target.user.tag, inline: true },
        { name: 'Moderator', value: message.author.tag, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Aevum | Development' })
    );
  }

  // !timeout @user <minutes>
  if (command === '!timeout') {
    const target = message.mentions.members.first();
    if (!target) return message.reply('Please mention a user.');
    const minutes = parseInt(args[2]);
    if (isNaN(minutes) || minutes < 1) return message.reply('Please provide a valid number of minutes.');
    await target.timeout(minutes * 60 * 1000).catch(console.error);
    const embed = new EmbedBuilder()
      .setColor(0xffaa00)
      .setTitle('User Timed Out')
      .addFields(
        { name: 'User', value: target.user.tag, inline: true },
        { name: 'Moderator', value: message.author.tag, inline: true },
        { name: 'Duration', value: `${minutes} minute(s)` }
      )
      .setTimestamp()
      .setFooter({ text: 'Aevum | Development' });
    message.channel.send({ embeds: [embed] });

    sendLog(message.guild, new EmbedBuilder()
      .setColor(0xffaa00)
      .setTitle('Member Timed Out')
      .addFields(
        { name: 'User', value: target.user.tag, inline: true },
        { name: 'Moderator', value: message.author.tag, inline: true },
        { name: 'Duration', value: `${minutes} minute(s)` }
      )
      .setTimestamp()
      .setFooter({ text: 'Aevum | Development' })
    );
  }

  // !del <amount>
  if (command === '!del') {
    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount < 1 || amount > 100) return message.reply('Please provide a number between 1 and 100.');
    await message.channel.bulkDelete(amount + 1, true).catch(console.error);
    const msg = await message.channel.send(`Deleted **${amount}** messages.`);
    setTimeout(() => msg.delete().catch(() => {}), 3000);

    sendLog(message.guild, new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('Messages Deleted')
      .addFields(
        { name: 'Amount', value: `${amount}`, inline: true },
        { name: 'Channel', value: `<#${message.channel.id}>`, inline: true },
        { name: 'Moderator', value: message.author.tag, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Aevum | Development' })
    );
  }

  // !slowmode <seconds>
  if (command === '!slowmode') {
    const seconds = parseInt(args[1]);
    if (isNaN(seconds) || seconds < 1) return message.reply('Please provide a valid number of seconds.');
    await message.channel.setRateLimitPerUser(seconds).catch(console.error);
    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('Slowmode Updated')
      .setDescription(`Slowmode set to **${seconds}** seconds.`)
      .setTimestamp()
      .setFooter({ text: 'Aevum | Development' });
    message.channel.send({ embeds: [embed] });
  }

  // !slowmodeoff
  if (command === '!slowmodeoff') {
    await message.channel.setRateLimitPerUser(0).catch(console.error);
    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('Slowmode Disabled')
      .setTimestamp()
      .setFooter({ text: 'Aevum | Development' });
    message.channel.send({ embeds: [embed] });
  }

  // !lock
  if (command === '!lock') {
    await message.channel.permissionOverwrites.edit(message.guild.id, { SendMessages: false }).catch(console.error);
    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('Channel Locked')
      .setDescription(`Locked by ${message.author.tag}`)
      .setTimestamp()
      .setFooter({ text: 'Aevum | Development' });
    message.channel.send({ embeds: [embed] });

    sendLog(message.guild, new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('Channel Locked')
      .addFields(
        { name: 'Channel', value: `<#${message.channel.id}>`, inline: true },
        { name: 'Moderator', value: message.author.tag, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Aevum | Development' })
    );
  }

  // !unlock
  if (command === '!unlock') {
    await message.channel.permissionOverwrites.edit(message.guild.id, { SendMessages: true }).catch(console.error);
    const embed = new EmbedBuilder()
      .setColor(0x00cc00)
      .setTitle('Channel Unlocked')
      .setDescription(`Unlocked by ${message.author.tag}`)
      .setTimestamp()
      .setFooter({ text: 'Aevum | Development' });
    message.channel.send({ embeds: [embed] });

    sendLog(message.guild, new EmbedBuilder()
      .setColor(0x00cc00)
      .setTitle('Channel Unlocked')
      .addFields(
        { name: 'Channel', value: `<#${message.channel.id}>`, inline: true },
        { name: 'Moderator', value: message.author.tag, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Aevum | Development' })
    );
  }

  // !delallc
  if (command === '!delallc') {
    const ADMIN_ROLE = '1495426802275848375';
    if (!message.member.roles.cache.has(ADMIN_ROLE)) {
      return message.reply('You need the admin role.');
    }
    
    const reply = await message.reply('Deleting all channels...');
    
    const channels = message.guild.channels.cache.filter(c => c.id !== message.channel.id && c.deletable);
    let deletedCount = 0;
    
    for (const [id, channel] of channels) {
      await channel.delete().catch(console.error);
      deletedCount++;
    }
    
    const embed = new EmbedBuilder()
      .setColor(0x00cc00)
      .setTitle('Channel Deletion Complete')
      .setDescription(`Deleted **${deletedCount}** channels.`)
      .setTimestamp()
      .setFooter({ text: 'Aevum | Development' });
    
    await message.channel.send({ embeds: [embed] });
    
    sendLog(message.guild, new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('All Channels Deleted')
      .addFields(
        { name: 'Moderator', value: message.author.tag, inline: true },
        { name: 'Amount', value: `${deletedCount}`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Aevum | Development' })
    );
  }

  // !delallr
  if (command === '!delallr') {
    const ADMIN_ROLE = '1495426802275848375';
    if (!message.member.roles.cache.has(ADMIN_ROLE)) {
      return message.reply('You need the admin role.');
    }
    
    await message.reply('Deleting all roles...');
    
    const roles = message.guild.roles.cache.filter(r => r.editable && r.id !== message.guild.id);
    const managedRoles = [];
    let deletedCount = 0;
    
    for (const [id, role] of roles) {
      if (role.managed) {
        managedRoles.push(role.name);
        continue;
      }
      await role.delete().catch(console.error);
      deletedCount++;
    }
    
    let resultMessage = `Deleted **${deletedCount}** roles.`;
    if (managedRoles.length > 0) {
      resultMessage += `\n\nCannot delete these roles (managed by Discord):\n${managedRoles.map(r => `- ${r}`).join('\n')}`;
    }
    
    const resultEmbed = new EmbedBuilder()
      .setColor(deletedCount > 0 ? 0x00cc00 : 0xff6600)
      .setTitle('Role Deletion Complete')
      .setDescription(resultMessage)
      .setTimestamp()
      .setFooter({ text: 'Aevum | Development' });
    
    message.channel.send({ embeds: [resultEmbed] });
    
    sendLog(message.guild, new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('All Roles Deleted')
      .addFields(
        { name: 'Moderator', value: message.author.tag, inline: true },
        { name: 'Deleted', value: `${deletedCount}`, inline: true },
        { name: 'Skipped', value: `${managedRoles.length}`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Aevum | Development' })
    );
  }

  // !alluser
  if (command === '!alluser') {
    const ADMIN_ROLE = '1495426802275848375';
    if (!message.member.roles.cache.has(ADMIN_ROLE)) {
      return message.reply('You need the admin role.');
    }
    
    const roleId = args[1];
    if (!roleId) return message.reply('Please provide a role ID.');
    
    const role = message.guild.roles.cache.get(roleId);
    if (!role) return message.reply('Invalid role ID.');
    
    await message.reply('Updating all members...');
    
    const members = await message.guild.members.fetch();
    let count = 0;
    
    for (const [id, member] of members) {
      if (member.user.bot) continue;
      await member.roles.set([role]).catch(console.error);
      count++;
    }
    
    const embed = new EmbedBuilder()
      .setColor(0x00cc00)
      .setTitle('All Users Updated')
      .addFields(
        { name: 'Role', value: role.name, inline: true },
        { name: 'Members', value: `${count}`, inline: true },
        { name: 'Moderator', value: message.author.tag, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Aevum | Development' });
    
    message.channel.send({ embeds: [embed] });
    
    sendLog(message.guild, new EmbedBuilder()
      .setColor(0x00cc00)
      .setTitle('Mass Role Update')
      .addFields(
        { name: 'Role', value: role.name, inline: true },
        { name: 'Members Affected', value: `${count}`, inline: true },
        { name: 'Moderator', value: message.author.tag, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Aevum | Development' })
    );
  }

  // !kickalluser
  if (command === '!kickalluser') {
    const ADMIN_ROLE = '1495426802275848375';
    if (!message.member.roles.cache.has(ADMIN_ROLE)) {
      return message.reply('You need the admin role.');
    }
    
    await message.reply('Kicking all users...');
    
    const PROTECTED_ROLE = '1488802434213089310';
    const members = await message.guild.members.fetch();
    let count = 0;
    
    for (const [id, member] of members) {
      if (member.user.bot) continue;
      if (member.id === message.guild.ownerId) continue;
      if (member.roles.cache.has(PROTECTED_ROLE)) continue;
      
      await member.kick('Mass kick by moderator').catch(console.error);
      count++;
    }
    
    const embed = new EmbedBuilder()
      .setColor(0xff6600)
      .setTitle('All Users Kicked')
      .addFields(
        { name: 'Members Kicked', value: `${count}`, inline: true },
        { name: 'Moderator', value: message.author.tag, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Aevum | Development' });
    
    message.channel.send({ embeds: [embed] });
    
    sendLog(message.guild, new EmbedBuilder()
      .setColor(0xff6600)
      .setTitle('Mass Kick')
      .addFields(
        { name: 'Members Kicked', value: `${count}`, inline: true },
        { name: 'Moderator', value: message.author.tag, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Aevum | Development' })
    );
  }
});

// Interactions
client.on('interactionCreate', async (interaction) => {

  // Support button
  if (interaction.isButton() && interaction.customId === 'ticket_support') {
    await interaction.deferReply({ ephemeral: true });
    const existing = interaction.guild.channels.cache.find(c => c.name === `ticket-${interaction.user.username.toLowerCase()}`);
    if (existing) {
      return interaction.editReply({ content: `You already have an open ticket: <#${existing.id}>` });
    }
    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      parent: SUPPORT_CATEGORY,
      permissionOverwrites: [
        { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        { id: STAFF_ROLE, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      ]
    });

    const embed = new EmbedBuilder()
      .setColor(0x000000)
      .setTitle('Support Ticket')
      .setDescription(`**${interaction.user.username}**\n\nA staff member will be with you shortly.`)
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setFooter({ text: 'Aevum | Development' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('close_ticket').setLabel('Close Ticket').setStyle(ButtonStyle.Danger),
    );

    await channel.send({ content: `<@${interaction.user.id}> <@&${STAFF_ROLE}>`, embeds: [embed], components: [row] });
    await interaction.editReply({ content: `Your ticket has been opened: <#${channel.id}>` });

    sendLog(interaction.guild, new EmbedBuilder()
      .setColor(0x000000)
      .setTitle('Ticket Opened — Support')
      .addFields(
        { name: 'User', value: interaction.user.tag, inline: true },
        { name: 'Channel', value: `<#${channel.id}>`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Aevum | Development' })
    );
  }

  // Buy button
  if (interaction.isButton() && interaction.customId === 'ticket_buy') {
    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('buy_select')
        .setPlaceholder('Select a product')
        .addOptions(
          { label: 'Lua Project', value: 'lua' },
          { label: 'JS Project', value: 'js' },
        )
    );
    await interaction.reply({ content: 'What do you want to buy?', components: [row], ephemeral: true });
  }

  // Buy select menu
  if (interaction.isStringSelectMenu() && interaction.customId === 'buy_select') {
    await interaction.deferUpdate();
    const product = interaction.values[0];
    const productLabel = product === 'lua' ? 'Lua Project' : 'JS Project';

    const existing = interaction.guild.channels.cache.find(c => c.name === `buy-${interaction.user.username.toLowerCase()}`);
    if (existing) {
      return interaction.followUp({ content: `You already have an open ticket: <#${existing.id}>`, ephemeral: true });
    }

    const channel = await interaction.guild.channels.create({
      name: `buy-${interaction.user.username}`,
      type: ChannelType.GuildText,
      parent: BUY_CATEGORY,
      permissionOverwrites: [
        { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        { id: STAFF_ROLE, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      ]
    });

    const embed = new EmbedBuilder()
      .setColor(0x000000)
      .setTitle('Purchase Request')
      .setDescription(`**${interaction.user.username}**\n**Product:** ${productLabel}\n\nA staff member will be with you shortly.`)
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setFooter({ text: 'Aevum | Development' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('close_ticket').setLabel('Close Ticket').setStyle(ButtonStyle.Danger),
    );

    await channel.send({ content: `<@${interaction.user.id}> <@&${STAFF_ROLE}>`, embeds: [embed], components: [row] });
    await interaction.followUp({ content: `Your ticket has been opened: <#${channel.id}>`, ephemeral: true });

    sendLog(interaction.guild, new EmbedBuilder()
      .setColor(0x000000)
      .setTitle('Ticket Opened — Buy')
      .addFields(
        { name: 'User', value: interaction.user.tag, inline: true },
        { name: 'Product', value: productLabel, inline: true },
        { name: 'Channel', value: `<#${channel.id}>`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Aevum | Development' })
    );
  }

  // Close ticket button
  if (interaction.isButton() && interaction.customId === 'close_ticket') {
    sendLog(interaction.guild, new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('Ticket Closed')
      .addFields(
        { name: 'Channel', value: interaction.channel.name, inline: true },
        { name: 'Closed by', value: interaction.user.tag, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Aevum | Development' })
    );
    await interaction.reply({ content: 'Closing ticket...' });
    setTimeout(() => interaction.channel.delete().catch(console.error), 3000);
  }
});

client.login(TOKEN);
