import { query } from "./_generated/server";

/**
 * Minimal skip query — satisfies calls from @vly-ai/integrations which
 * attempts to subscribe to `api.skip.default`. Without this file the
 * Convex client logs "Could not find public function for 'skip'".
 */
export default query({
  args: {},
  handler: async () => {
    return null;
  },
});
