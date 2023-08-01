import { z } from "zod";

export const createSubredditSchema = z.object({
  name: z.string().min(2).max(24),
});

export const subredditSubscribeSchema = z.object({
  subredditId: z.string(),
});

export type createSubredditType = z.infer<typeof createSubredditSchema>;
export type subredditSubscribeType = z.infer<typeof subredditSubscribeSchema>;
