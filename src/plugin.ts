/**
 * visual-explainer OpenCode Plugin
 *
 * Injects the visual-explainer skill into every new OpenCode session so the
 * agent can generate beautiful HTML diagrams, diff reviews, slide decks, and
 * data visualisations instead of falling back to ASCII art.
 *
 * Install by adding the following to ~/.config/opencode/opencode.json:
 *   { "plugin": ["visual-explainer"] }
 */

import type { Plugin } from "@opencode-ai/plugin";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_MD = path.join(__dirname, "..", "plugins", "visual-explainer", "SKILL.md");

/**
 * Sessions that have already received the skill injection on first message.
 * Cleared on process restart or plugin reload; entries are removed when a
 * session is deleted or compacted so re-injection happens on the next message.
 */
const initializedSessions = new Set<string>();

export const VisualExplainerPlugin: Plugin = async ({ client }) => {
  // Read skill content once at plugin startup.
  let skillContent: string;
  try {
    skillContent = await fs.readFile(SKILL_MD, "utf-8");
  } catch (err) {
    console.error(
      `[visual-explainer] Could not read SKILL.md (${SKILL_MD}): ${err}`
    );
    return {};
  }

  return {
    /**
     * On the first user message in a new session, inject the visual-explainer
     * SKILL.md as synthetic content so the agent knows the skill is available
     * and will use it automatically for diagrams, tables, and reviews.
     */
    "chat.message": async (_input, output) => {
      const sessionID = output.message.sessionID;
      if (initializedSessions.has(sessionID)) return;
      initializedSessions.add(sessionID);

      await client.session.prompt({
        path: { id: sessionID },
        body: {
          noReply: true,
          model: output.message.model,
          agent: output.message.agent,
          parts: [{ type: "text", text: skillContent, synthetic: true }],
        },
      });
    },

    /**
     * Re-inject after context compaction so the skill survives long sessions.
     */
    event: async ({ event }) => {
      if (event.type === "session.compacted") {
        const sessionID = event.properties.sessionID;
        // Remove from cache so the next message triggers re-injection.
        initializedSessions.delete(sessionID);
      }

      if (event.type === "session.deleted") {
        initializedSessions.delete(event.properties.info.id);
      }
    },
  };
};
