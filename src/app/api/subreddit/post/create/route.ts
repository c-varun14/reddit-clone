import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { createPostSchema } from "@/lib/validators/post";
import { z } from "zod";

export const POST = async (req: Request) => {
  try {
    const session = await getAuthSession();

    if (!session?.user) return new Response("Unauthorised", { status: 401 });

    const body = await req.json();

    const payload = createPostSchema.parse(body);

    const isSuscribed = await db.subscription.findFirst({
      where: {
        subredditId: payload.subredditId,
        userId: session?.user.id,
      },
    });

    if (!isSuscribed)
      return new Response("You must be subscribed to do this", { status: 400 });

    await db.post.create({
      data: {
        authorId: session?.user.id,
        ...payload,
      },
    });

    return new Response("Post Created");
  } catch (err) {
    if (err instanceof z.ZodError)
      return new Response("Wrong data provided", { status: 422 });
    return new Response("Internal Error", { status: 500 });
  }
};
