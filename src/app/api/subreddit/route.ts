import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { createSubredditSchema } from "@/lib/validators/subreddit";
import { z } from "zod";

export async function POST(req: Request) {
  const session = await getAuthSession();
  try {
    if (!session?.user) {
      return new Response("Not Authenticated", { status: 401 });
    }

    const body = await req.json();
    const { name } = createSubredditSchema.parse(body);
    const subredditExists = await db.subreddit.findFirst({
      where: { name },
    });

    if (subredditExists)
      return new Response("Subreddit already exists", { status: 409 });
    const createdSubreddit = await db.subreddit.create({
      data: {
        name,
        creatorId: session.user.id,
      },
    });
    await db.subscription.create({
      data: {
        subredditId: createdSubreddit.id,
        userId: session.user.id,
      },
    });

    return new Response(createdSubreddit.name, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError)
      return new Response("Enter a correct length of subreddit", {
        status: 403,
      });
    return new Response(
      "Something went wrong! Could not create the subreddit",
      { status: 500 }
    );
  }
}
