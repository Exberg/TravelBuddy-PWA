---
description: Use when building a new travel itinerary, rebuilding one, or making a change that reshapes a day or more. Covers the research procedure, sequencing rules, and the exact JSON to pass to save_itinerary.
---

# Itinerary planning procedure

This is the procedure for turning trip context into a published itinerary. Work through it in order.

## 1. Establish the constraints

Read the trip context and the conversation for:

* destination
* start and end date, or a trip length
* total budget in RM and the number of travelers
* dietary restrictions, allergies, halal requirements
* must-visit places the traveler explicitly selected
* interests, pace, and neighbourhood preferences

Hard constraints, never to be violated: destination, dates or day count, total budget, allergies, dietary restrictions, halal requirements, and must-visit places.

Interests, pace, cuisines, and neighbourhood preferences are optimization signals, not requirements.

If you are editing an existing itinerary, call `get_itinerary` first.

## 2. Choose the planning shape

For one to three days, research and assemble the plan directly.

For four days or more, create a global blueprint before researching individual stops:

* assign every exact date to one geographic area
* allocate every must-visit place exactly once
* give each day a soft budget envelope
* record pace, meal, dietary, mobility, arrival, and departure constraints
* note the start and end anchor for each delegated range

For trips up to eight days, delegate contiguous one-to-two-day ranges to `day_planner`: two planners for four days, three for five or six days, and four for seven or eight days. Never assign a three-day range when the trip is eight days or shorter; one slow child keeps the entire cohort incomplete and blocks `save_itinerary`. For longer trips, use four balanced ranges. Start the whole batch in one model step. Start each message with `Traveler label: Days X–Y · Area` so the app can show safe progress, then put the destination, travelers, exact dates and day numbers, assigned areas and must-visits, budget envelope, all hard constraints, and relevant preferences into the body. Children do not see this conversation, trip context, or itinerary state.

Keep delegation briefs bounded: request stop costs only in MYR, decisive opening or booking checks only, and key travel hops rather than every hop. Do not ask the child for both destination-currency and MYR figures or for exhaustive verification. Every planner has a strict two-round research budget and must return a complete draft from the evidence it has after those rounds.

Each child returns day drafts only. Merge those drafts yourself and retain successful ranges if another child fails. Never let a child publish or treat an individual result as the itinerary.

### Mandatory receipt gate

The immediate `{ "status": "working", ... }` result from `day_planner` or `itinerary_reviewer` is an admission receipt, not child output. Eve continues the model loop after returning it, so you must enforce the boundary yourself:

1. After dispatching `day_planner`, the next model step calls no tools and ends the turn with at most a brief confirmation. Never call `itinerary_reviewer` or construct a merged draft in that turn.
2. Count a planner range as complete only when a later framework task notification explicitly includes that child's structured result. Never synthesize, outline, or reconstruct an outstanding range yourself.
3. Call `itinerary_reviewer` only after real results for every assigned range are present. When its working receipt returns, the next step calls no tools and ends the turn.
4. Call `save_itinerary` only on the later turn that contains the real reviewer report.

These gates apply even when you believe you could produce a plausible itinerary or review without the child.

If a planner fails or returns an unusable draft, retry its range once with a fresh child and no `agentId`; reusing the failed child also reuses the context that made it fail. Split a failed multi-day range into one-day retries and launch them in one batch. After any retry failure, stop delegating and continue to review and publish the usable days with the missing dates named in `assumptions`.

Delegation is asynchronous. Each `day_planner` call returns a working receipt immediately, after which you must end the turn as required by the receipt gate; each child's draft arrives later in a new turn. Expect one wake per child. On a wake where ranges are still outstanding, keep the drafts and end the turn silently. Pick this procedure back up at step 7 on the wake that delivers the last outstanding range, and carry it through the reviewer notification and `save_itinerary` without waiting for the traveler.

## 3. Research with real places

1. Call `geocode_place` once on the destination to anchor coordinates.
2. Use `search_places` with `near` set to those coordinates, asking for 10-15 results per call so one call covers several slots. Search by need across the whole trip — sights, cafes, local food, one evening option — rather than once per individual slot. Aim for four to six searches for a short trip, not one per stop.
3. Call `place_details` only where the timing or the dietary answer actually decides the plan: a ticketed attraction, a place you suspect closes early, a food stop with a stated dietary requirement. Three or four detail lookups is usually enough. For everything else the search result's rating, price bucket and open-now flag are sufficient.
4. Call `travel_time` for any hop where the traveler's plan depends on the duration: a long hop, a tight connection, or a choice between walking and driving.

`travelFromPrevious` reports a measured hop. Only set it when `travel_time` actually returned that duration. If you did not measure the hop, omit the field. Never fill it with an estimate from coordinates, and never tell the traveler a tool was unavailable unless it actually returned an error.

Every place in the itinerary must come from a lookup. Carry its `placeId`, `address`, `lat`, and `lng` into the stop so the app can deep-link it.

Keep the research proportional. Every tool call adds a visible delay for someone waiting on a phone, so gather broadly, then assemble from what you already have. Stop researching once each slot has a real place; do not verify a plan you have already verified.

## 4. Sequence the days

* One geographic cluster per day. Name it in the day's `area`.
* Order stops by clock time.
* Leave realistic gaps. A museum is not 20 minutes; a hawker lunch is not 3 hours.
* Meals at meal times. A full day has breakfast or morning coffee, lunch, and dinner.
* Three to six stops per day. More than six is a plan nobody can follow.
* Must-visit places first, then interests, then convenience.

## 5. Cost it

The budget is the total for the whole party for the whole trip unless the traveler said otherwise.

Put an approximate `estimatedCostMyr` on stops that cost money, for the whole party. Omit it for free stops. Do not fabricate exact prices.

When `budgetCurrency` and `destinationCurrency` differ, call `convert_currency` once with the complete trip budget, before you write the plan. The rate is held server-side and is not in your context, so this is the only way to get a correct figure; a number you work out yourself will be wrong. Reuse its result rather than converting every stop.

Keep `estimatedCostMyr` and `estimatedTotalMyr` in MYR because that is the itinerary schema's canonical currency. The converted figure belongs in the message you send after saving, where you tell the traveler how the plan sits against their budget.

If `convert_currency` reports that no pair was recorded, continue budgeting in MYR and mention the missing destination-currency estimate in `assumptions`.

If the trip cannot fit the budget, build the closest affordable version and say so in `assumptions`.

## 6. Handle food safety

Never ignore an allergy or dietary restriction.

Set `halalStatus` on food stops only:

* `certified` only when you actually confirmed certification
* `muslim_friendly` or `pork_free_claimed` when place details or reviews support it
* `unverified` otherwise

Never claim a place is halal because its cuisine usually is. Put anything the traveler must check themselves in that stop's `warning`.

## 7. Review and publish it

After merging the actual delivered results for every delegated range, call `itinerary_reviewer` exactly once with the full trip brief and complete itinerary draft. The reviewer also runs in the background: its immediate working receipt is not a review, and you must end that turn without calling another tool. Its report arrives in a later task-notification turn; publish on that turn. Fix all findings marked as errors. Resolve warnings where reliable evidence is available; otherwise carry the uncertainty into the relevant stop warning or itinerary assumption. Suggestions are optional and must not displace explicit traveler preferences.

A merged draft that is never published is a failed plan: the app renders only what `save_itinerary` stores, so the traveler sees nothing until that call lands. If the review never arrives or a range is unrecoverable, publish the complete days you have, note the gap in `assumptions`, and say which days still need work.

Before publishing, perform the deterministic checks enforced by `save_itinerary`: unique stop and place identities, chronological non-overlapping stops, sensible segment labels, valid coordinates, complete day coverage, no accidental partial replacement, and budget comparison.

Call `save_itinerary` with the complete plan and a one-line `changeNote`. The tool replaces the previous version, so always send every day and every stop, not a diff.

The itinerary object looks like this:

```json
{
  "title": "Penang Heritage Flow",
  "destination": "George Town, Penang, Malaysia",
  "startDate": "2026-10-14",
  "endDate": "2026-10-16",
  "travelers": 2,
  "summary": "Three walkable days through the heritage core, with hawker food and one coastal sunset.",
  "estimatedTotalMyr": 980,
  "budgetMyr": 4500,
  "assumptions": ["Assumed a hotel is already booked in the heritage core."],
  "days": [
    {
      "day": 1,
      "date": "2026-10-14",
      "title": "Heritage core on foot",
      "area": "George Town heritage core",
      "stops": [
        {
          "id": "toh-soon-kopi",
          "time": "08:30",
          "segment": "morning",
          "title": "Toh Soon Cafe",
          "description": "Charcoal-toast kaya breakfast in a back lane before the heat.",
          "category": "cafe",
          "durationMinutes": 60,
          "placeId": "ChIJ...",
          "address": "184 Lebuh Campbell, George Town",
          "lat": 5.4187,
          "lng": 100.3327,
          "estimatedCostMyr": 20,
          "halalStatus": "unverified",
          "warning": "Halal status not verified; confirm on arrival if it matters."
        },
        {
          "id": "blue-mansion-tour",
          "time": "11:00",
          "segment": "morning",
          "title": "Cheong Fatt Tze Blue Mansion",
          "description": "Guided tour of the indigo courtyard house; tours run on a fixed schedule.",
          "category": "sight",
          "durationMinutes": 60,
          "placeId": "ChIJ...",
          "address": "14 Leith St, George Town",
          "lat": 5.4212,
          "lng": 100.3345,
          "estimatedCostMyr": 50,
          "bookingRequired": true,
          "travelFromPrevious": { "mode": "walk", "durationMinutes": 9, "distanceMeters": 700 }
        }
      ]
    }
  ]
}
```

Field rules:

* `id` is kebab-case and unique across the entire itinerary. When editing, keep the existing id of every stop you are not replacing.
* `time` is 24-hour `HH:MM`.
* `segment` is `morning`, `afternoon`, or `evening`.
* `category` is one of `sight`, `food`, `cafe`, `activity`, `nature`, `shopping`, `nightlife`, `transport`, `stay`, `rest`.
* `travelFromPrevious.mode` is one of `walk`, `drive`, `transit`, `bicycle`, `ferry`. Omit it on the first stop of a day.
* `date` is `YYYY-MM-DD`, and only when the trip dates are known.
* Omit any optional field you do not have a real value for. Never emit `null`, `"unknown"`, or a placeholder.
* Do not add fields that are not listed above.

## 8. Editing an existing itinerary

Call `get_itinerary` first. The plan is not in your context, and `save_itinerary` will refuse a publish that has fewer days or stops than the stored one until you have read it.

Apply the requested change and nothing else.

Keep untouched days, stops, ids, times, and costs exactly as they were. Re-time only the stops the change affects, and re-check travel times for hops you altered.

Then publish the complete itinerary with `save_itinerary`.
