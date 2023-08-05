import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { postVoteSchema } from "@/lib/validators/vote";
import { CachedPost } from "@/types/redis";
import { VoteType } from "@prisma/client";
import { z } from "zod";

const NO_OF_UPVOTES_TO_CACHE = 1; //TODO: Change value while deploying

export const PATCH = async (req: Request) => {
  try {
    const body = await req.json();
    const { postId, voteType } = postVoteSchema.parse(body);

    const session = await getAuthSession();

    if (!session?.user) return new Response("Unauthorized", { status: 401 });

    const existingVote = await db.vote.findFirst({
      where: {
        postId,
        type: voteType,
      },
    });
    const post = await db.post.findFirst({
      where: {
        id: postId,
      },
      include: {
        author: true,
        votes: true,
      },
    });

    let currentVote: VoteType | null = voteType;

    if (!post) return new Response("Post not found", { status: 404 });
    //for indentation
    else if (existingVote) {
      if (existingVote.type === voteType) {
        await db.vote.delete({
          where: {
            userId_postId: {
              userId: session.user.id,
              postId,
            },
          },
        });
        currentVote = null;
      } else
        await db.vote.update({
          where: {
            userId_postId: {
              userId: session.user.id,
              postId,
            },
          },
          data: {
            type: voteType,
          },
        });
    }

    //for indentaion
    else if (!existingVote)
      await db.vote.create({
        data: {
          userId: session.user.id,
          postId,
          type: voteType,
        },
      });

    const votesAmt = post.votes.reduce((acc, vote) => {
      if (vote.type === "UP") return acc + 1;
      else if (vote.type === "DOWN") return acc - 1;
      return acc;
    }, 0);

    if (votesAmt >= NO_OF_UPVOTES_TO_CACHE) {
      const cachePayload: CachedPost = {
        authorUsername: post.author.username ?? "",
        content: JSON.stringify(post.content),
        createdAt: post.createdAt,
        currentVote,
        title: post.title,
        id: post.id,
      };

      await redis.hset(`post:${postId}`, cachePayload);
    }

    return new Response("Successful");
  } catch (err) {
    if (err instanceof z.ZodError)
      return new Response("Worng data", { status: 422 });
    return new Response("Internal Error", { status: 500 });
  }
};
