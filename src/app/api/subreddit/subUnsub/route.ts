import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { subredditSubscribeSchema } from "@/lib/validators/subreddit";
import { Session } from "next-auth";
import { z } from "zod";

export const POST = async (req: Request) => {
  try {
    const session: Session | null = await getAuthSession();
    if (!session?.user) return new Response("Unauthorised", { status: 401 });
    const body = await req.json();
    const { subredditId } = subredditSubscribeSchema.parse(body);
    const subreddit = await db.subreddit.findFirst({
      where: {
        id: subredditId,
      },
    });
    if (subreddit?.creatorId === session.user.id)
      return new Response("Not possible", { status: 403 });

    const isSubscribed = await db.subscription.findFirst({
      where: {
        subredditId: subredditId,
        userId: session.user.id,
      },
    });

    if (isSubscribed) {
      await db.subscription.delete({
        where: {
          userId_subredditId: {
            subredditId: subredditId,
            userId: session.user.id,
          },
        },
      });
      return new Response("Subcription removed");
    }

    await db.subscription.create({
      data: {
        subredditId: subredditId,
        userId: session.user.id,
      },
    });
    return new Response("Subscribed", { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError)
      return new Response("Bad request", { status: 422 });
    return new Response("Something went wrong", { status: 500 });
  }
};
