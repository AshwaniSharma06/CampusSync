/**
 * DEPRECATED: Client-Side Fallback Synthesizer
 * 
 * Removed in Phase 2 in accordance with CampusSync AI architecture guidelines.
 * All responses are now strictly generated dynamically via the backend RAG pipeline and Google Gemini.
 * Never silently replace live API responses with hardcoded strings.
 */

export const generateLocalAIResponse = () => {
  return "⚠️ Direct offline mode is deprecated. Please ensure the CampusSync backend API is connected.";
};
