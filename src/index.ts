import { Context, Markup, NarrowedContext, Telegraf } from "telegraf"
import dotenv from "dotenv"
import { message } from "telegraf/filters"
import { Update } from "telegraf/typings/core/types/typegram"
import { Address, address } from "@ton/core"
dotenv.config()

const token = process.env.TG_BOT_TOKEN || ""

const bot = new Telegraf(token)

bot.on(message("text"), (ctx) => {
  const text = ctx.message.text // Access the text property directly

  const resp = handleReferralId(text)
  if (!resp) return
  if (!(resp.address && resp.id && resp.refId)) return
  ctx.reply(
    "Launch swap",
    Markup.inlineKeyboard([
      Markup.button.webApp(
        "Launch",
        `https://nutswap.vercel.app/${
          resp.address ? `?refId=${resp.address}` : ""
        }`
      ),
    ])
  )
})

function handleReferralId(text: string):
  | {
      refId: string
      address: string
      id: string
    }
  | undefined {
  let parameter
  const exp = text.match(/\/start (.*)/) // Destructuring on the text
  if (exp) {
    const [, param] = exp
    parameter = param
  }
  console.log(`Received start command with parameter: ${parameter}`)

  // Perform actions based on the extracted parameter
  if (!parameter) return
  const [refId, address, id] = parameter?.split("-")

  return { refId, address, id }
}

bot.launch()

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"))
process.once("SIGTERM", () => bot.stop("SIGTERM"))
