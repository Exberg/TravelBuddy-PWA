import { eveChannel } from "eve/channels/eve";
import { localDev, none, vercelOidc } from "eve/channels/auth";

export default eveChannel({
  auth: [
    // Lets the eve TUI and your Vercel deployments reach the deployed agent.
    vercelOidc(),
    // Open on localhost for `eve dev` and the REPL; ignored in production.
    localDev(),
    // Public demo access for the PWA. There is no per-user auth here:
    // anyone who can reach this deployment can start/continue sessions.
    // Replace with a real AuthFn (Auth.js, Clerk, API key, etc.) before
    // this agent handles anything private or ships to real users.
    none(),
  ],
  // A separately deployed PWA can call the agent through VITE_EVE_URL.
  cors: true,
});
