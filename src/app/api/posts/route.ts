import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

export const GET = async (req: Request) => {
  try {
    const url = new URL(req.url);

    const session = await getAuthSession();

    const { limit, page, subredditName } = z
      .object({
        limit: z.string(),
        page: z.string(),
        subredditName: z.string().nullish().optional(),
      })
      .parse({
        subredditName: url.searchParams.get("subredditName"),
        limit: url.searchParams.get("limit"),
        page: url.searchParams.get("page"),
      });

    let whereClause = {};

    if (!subredditName && !session?.user) {
      const posts = await db.post.findMany({
        skip: (parseInt(page) - 1) * parseInt(limit), // skip should start from 0 for page 1
        orderBy: {
          createdAt: "desc",
        },
        include: {
          votes: true,
          author: true,
          comments: true,
          subreddit: true,
        },
        take: parseInt(limit),
      });
      return new Response(JSON.stringify(posts));
    } else if (subredditName) {
      whereClause = {
        subreddit: {
          name: subredditName,
        },
      };
    } else if (session?.user) {
      let followedCommunitiesIds: string[] = [];

      const followedCommunities = await db.subscription.findMany({
        where: {
          userId: session.user.id,
        },
        include: {
          subreddit: true,
        },
      });

      followedCommunitiesIds = followedCommunities.map(
        ({ subreddit }) => subreddit.id
      );

      whereClause = {
        subreddit: {
          id: {
            in: followedCommunitiesIds,
          },
        },
      };
    }

    const posts = await db.post.findMany({
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      orderBy: {
        createdAt: "desc",
      },
      include: {
        subreddit: true,
        votes: true,
        author: true,
        comments: true,
      },
      where: whereClause,
    });

    return new Response(JSON.stringify(posts));
  } catch (err) {
    if (err instanceof z.ZodError)
      return new Response("Invalid request data", { status: 422 });
    return new Response("Could not fetch posts", { status: 500 });
  }
};
