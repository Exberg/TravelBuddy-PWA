import { disableTool } from "eve/tools";

// Every eve delegation path (the built-in `agent` copy and declared subagents)
// runs as a durable background task: the call returns a receipt, the turn ends,
// and the child's result arrives on a later task-triggered turn.
//
// The TravelBuddy PWA only streams the turn it started, so an itinerary
// published from a background turn would never reach the trip timeline the
// traveler is looking at. Itinerary work therefore stays in the traveler's own
// turn, guided by the `itinerary-planning` skill, and delegation is disabled so
// the model cannot wander onto that path.
export default disableTool();
