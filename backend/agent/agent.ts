import { defineAgent, defineDynamic } from "eve";
import {
  hydrateItineraryState,
  resolveClientItinerarySnapshot,
} from "./lib/itinerary";
import {
  hydrateCurrencyRateState,
  resolveClientCurrencyRate,
} from "./lib/currency";
import { selectQwenModel } from "./qwen-model";

export default defineAgent({
  defaultTools: false,
  reasoning: "low",
  model: defineDynamic({
    events: {
      "step.started": (_event, ctx) => {
        const itinerarySnapshot = resolveClientItinerarySnapshot(ctx.messages);
        if (itinerarySnapshot) hydrateItineraryState(itinerarySnapshot);
        const currencyRate = resolveClientCurrencyRate(ctx.messages);
        if (currencyRate) hydrateCurrencyRateState(currencyRate);

        return selectQwenModel();
      },
    },
  }),
});
