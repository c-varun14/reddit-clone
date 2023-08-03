import { string, z } from "zod";

export const createPostSchema = z.object({
  title: z
    .string()
    .min(3, "The title must be atleast 3 characters long")
    .max(130, "The title cannot be longer than 130 characters"),
  subredditId: z.string(),
  content: z.any(),
});

export type createPostType = z.infer<typeof createPostSchema>;
