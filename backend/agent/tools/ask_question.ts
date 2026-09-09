import { disableTool } from "eve/tools";

// The Expo client currently exchanges ordinary chat messages and cannot submit
// Eve's structured human-in-the-loop responses. Keep clarification in chat so a
// question never parks the durable session with no way for the user to answer.
export default disableTool();
