const { Telegraf, Markup } = require("telegraf");
const dotenv = require("dotenv").config();

const token = process.env.TG_BOT_TOKEN || "";
console.log("Token:", token);

const bot = new Telegraf(token);



// Function to handle referral ID
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
  
  const [refId, userId] = parameter.split("-");
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
    const url = userId !== null
      ? `https://smartgreen.vercel.app/?referralId=${userId}`
      : "https://smartgreen.vercel.app";

    await ctx.reply(`Welcome back ${ctx.from.username}`, {
      reply_markup: {
        inline_keyboard: [
          [Markup.button.webApp("Launch", url)],
        ],
      },
    });
    return;
  }

  await ctx.reply(`Welcome ${ctx.from.username}`, {
    reply_markup: {
      inline_keyboard: [
        [Markup.button.webApp("Launch", "https://smartgreen.vercel.app")],
      ],
    },
  });
});

// Launch the bot
bot.launch({
  webhook: {
    domain: 'https://smartbot-3of7.onrender.com',
    port: process.env.PORT || 3000,
  },
}).then(() => {
  console.log("Bot is running");
}).catch(err => {
  console.error("Failed to launch the bot:", err);
});
