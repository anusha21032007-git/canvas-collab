const SESSION_KEY = "whiteboard_session_id";

/**
 * Retrieves the session ID from localStorage, or creates a new one if it doesn't exist.
 * This allows anonymous users to have persistent sessions.
 * @returns {string} The session ID.
 */
export function getSessionId(): string {
  try {
    let sessionId = localStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
  } catch (error) {
    console.error("Could not access localStorage. Using a temporary session ID.", error);
    // Fallback for environments where localStorage is not available
    return crypto.randomUUID();
  }
}