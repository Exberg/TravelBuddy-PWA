import { disableTool } from "eve/tools";

// TravelBuddy is a consumer travel assistant. It has no legitimate reason to
// run shell commands or touch the sandbox filesystem, and the `stay-in-scope`
// eval showed the model will happily do so when a user asks. Removing the
// capability is stronger than instructing against it.
export default disableTool();
