const { Telegraf, Markup, Scenes, session } = require("telegraf")
const dotenv = require("dotenv").config()


const token = process.env.TG_BOT_TOKEN || ""

console.log("Token:", token)
const bot = new Telegraf(token)

connectDB()




// The handleReferralId function
function handleReferralId(text) {
  if (!text) {
    console.log("No text provided.")
    return undefined
  }
  const parts = text.split(" ")
  const parameter = parts.length > 1 ? parts[1] : undefined
  console.log(`Received start command with parameter: ${parameter}`)

  // Perform actions based on the extracted parameter
  if (!parameter) return undefined
  const [refId, userId] = parameter.split("-")

  if (refId === "refId") {
    return { userId }
  }
  return undefined
}


// Handler for /start command
bot.start(async (ctx) => {
  console.log("Received /start command with message:", ctx.message.text)

  const referralData = handleReferralId(ctx.message.text)
  if (referralData !== undefined) {
    const { userId } = referralData

  

  const url = userId !=null
    ? `https://smartgreenapp.vercel.app/?refId=${userId}` 
    : "https://smartgreenapp.vercel.app";

      await ctx.reply(`Welcome back ${ctx.from.username}`, {
        reply_markup: {
          inline_keyboard: [
            [
              Markup.button.webApp("Launch", url), ],
          ],
        },
      })
      return
    }



bot.launch({
    webhook: {
        domain: 'https://nutswap-bot.onrender.com',
        port: process.env.PORT || 3000,
    },
});

