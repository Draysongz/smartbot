const { Telegraf, Markup, Scenes, session } = require('telegraf');
const dotenv = require('dotenv').config();
const { connectDB } = require('./db/connect');
const { UserDetails } = require('./model/userModel');

const token = process.env.TG_BOT_TOKEN || "";

console.log("Token:", token);
const bot = new Telegraf(token);

connectDB();

const ReferralScene = new Scenes.BaseScene('ReferralScene');
const GenerationScene = new Scenes.BaseScene('GenerationScene');
const stage = new Scenes.Stage([ReferralScene, GenerationScene]);
bot.use(session());
bot.use(stage.middleware());

bot.use(async (ctx, next) => {
    const userId = ctx.from.id;

    // Check if user details are already in the database
    const existingUser = await UserDetails.findOne({ userId });

    if (!existingUser) {
        // Save user details to the database
        const newUser = new UserDetails({
            userId,
            username: ctx.from.username,
            firstName: ctx.from.first_name,
            lastName: ctx.from.last_name,
        });

        await newUser.save();
    }

    // Continue to the next middleware
    next();
});

// The handleReferralId function
function handleReferralId(text) {
  if (!text) {
    console.log("No text provided.");
    return undefined;
  }
  const parts = text.split(" ");
  const parameter = parts.length > 1 ? parts[1] : undefined;
  console.log(`Received start command with parameter: ${parameter}`);

  // Perform actions based on the extracted parameter
  if (!parameter) return undefined;
  const [refId,userId] = parameter.split("-");

  if (refId === "refId") {
    return { userId };
  }
  return undefined;
}

// Handler for /start command
bot.start(async (ctx) => {
  console.log("Received /start command with message:", ctx.message.text);
  
  const referralData = handleReferralId(ctx.message.text);
  if (referralData !== undefined) {
    const { userId } = referralData;

    // Check if the user has already been referred
    const existingUser = await UserDetails.findOne({ userId, referredUsers: ctx.from.id.toString() });
    if (existingUser) {
      console.log(`User with userId=${userId} has already been referred.`);
      await ctx.reply(`Welcome back ${ctx.from.username}`, {
        reply_markup: {
          inline_keyboard: [
            [Markup.button.webApp("Launch", 'https://nutswap.vercel.app'),
              { text: "💰Referral", callback_data: 'referral' }
            ],
            [{ text: '📲Support', url: 'https://t.me/Nutswap_Support' }]
          ]
        }
      });
      return;
    }

    // Update referral count and referredUsers array
    await UserDetails.findOneAndUpdate(
      { userId },
      { $inc: { referralCount: 1 }, $addToSet: { referredUsers: ctx.from.id.toString() } },
      { new: true, upsert: true }
    );
    
    const refData = await UserDetails.findOne({ userId });
    const refWallet = refData.walletAddress;
    console.log(`Referral data found: address=${refWallet}, userId=${userId}`);
    await ctx.reply(
      `Received referral with address: ${refWallet} and userId: ${userId}`,
      {
        reply_markup: {
          inline_keyboard: [
            [Markup.button.webApp("Launch", `https://nutswap.vercel.app/${refWallet ? `?refId=${refWallet}` : ""}`), 
               { text: "💰Referral", callback_data: 'referral' }
            ],
           
            [{ text: '📲Support', url: 'https://t.me/Nutswap_Support' }]
          ]
        }
      }
    );
  } else {
    console.log("No referral data found.");
    await ctx.reply(
      "Welcome to the bot! No referral data found.", {
        reply_markup: {
          inline_keyboard: [
            [Markup.button.webApp("Launch", 'https://nutswap.vercel.app'),
              { text: "💰Referral", callback_data: 'referral' }
            ],
            [{ text: '📲Support', url: 'https://t.me/Nutswap_Support' }]
          ]
        }
      }
    );
  }
});

ReferralScene.enter(async (ctx) => {
  const userId = ctx.from.id;

  const existingUser = await UserDetails.findOne({ userId });
  if (existingUser && existingUser.referralLink !== "null") {
    const truncatedWalletAddress = `${existingUser.walletAddress.slice(0, 4)}...${existingUser.walletAddress.slice(-6)}`;
    const referralMessage = `
    🎉 Welcome back, ${ctx.from.username}!

    💰 Invite your friends to earn 20% on fees. The more you invite the more you earn

    Your Referrals (updated every 15 min)
    • Users referred: ${existingUser.referralCount || 0}
    • Total paid: 0 TON ($0.00)
    

    Rewards are paid directly to your chosen Rewards Wallet as soon as your downlines make a swap on the dex.

    🌐 Your Referral Link: ${existingUser.referralLink}

    Share your link with friends and earn rewards!

    Thank you for being a valued member of our communutty!
    `;

    await ctx.reply(referralMessage, {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Close', callback_data: 'leaveref' }],
          [{ text: `Referral Link Wallet: ${truncatedWalletAddress}`, callback_data: 'show_wallet' }]
        ]
      }
    });
    
  } else {
    await ctx.reply("It seems you don't have a referral link yet. Please generate one to start referring your friends!", {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Generate Link', callback_data: 'generate_referral' }]
        ]
      }
    });
  }
});


bot.action('leaveref', async(ctx)=>{
  await ctx.deleteMessage()
  ctx.scene.leave()
})


GenerationScene.enter(async (ctx) => {
 await ctx.reply("Please send your connected wallet address.\nEnsure it is the initialized wallet on the DEX:");

  ctx.scene.state.userId = ctx.from.id; // Store user ID in the scene state
});

GenerationScene.on('text', async (ctx) => {
  const walletAddress = ctx.message.text;
  const userId = ctx.scene.state.userId;

  // Generate a referral link
  const referralLink = `https://t.me/Nutcoin_swapbot?start=refId-${userId}`;

  // Update the user's details with the wallet address and generated referral link
  await UserDetails.findOneAndUpdate(
    { userId },
    { referralLink, walletAddress},
    { new: true, upsert: true }
  );

  // Notify the user about the generated referral link
  await ctx.reply(`
  🎉 Your referral link has been generated!

  🌐 Your Referral Link: ${referralLink}

  Share your link with friends and earn rewards!

  Thank you for being a valued member of our communutty!
  `);

  ctx.scene.leave();
});



bot.action('referral', async (ctx) => {
  ctx.scene.enter('ReferralScene');
});

bot.hears('/referral', async(ctx)=>{
  ctx.scene.enter('ReferralScene');
})

bot.hears('/support', async (ctx) => {
  ctx.reply('If you need any assistance, please join our support group:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📲 Support', url: 'https://t.me/Nutswap_Support' }]
      ]
    }
  });
});

bot.hears('/swap', async (ctx) => {
  ctx.reply('Click the button below to launch our decentralized exchange (DEX):', {
    reply_markup: {
      inline_keyboard: [
        [Markup.button.webApp("Launch", 'https://nutswap.vercel.app')]
      ]
    }
  });
});


bot.action('generate_referral', async (ctx) => {
  ctx.scene.enter('GenerationScene');
});

bot.launch().then(() => {
  console.log("Bot launched successfully");
}).catch((error) => {
  console.error("Error launching bot:", error);
});
