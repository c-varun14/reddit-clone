import { NO_OF_INFINITE_SCROLL_RESULTS } from "@/config";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import PostFeed from "./PostFeed";
import { notFound } from "next/navigation";

const CustomFeed = async () => {
  const session = await getAuthSession();

  if (!session) return notFound();

  const followedCommunities = await db.subscription.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      subreddit: true,
    },
  });

  const posts = await db.post.findMany({
    where: {
      subreddit: {
        name: {
          in: followedCommunities.map(({ subreddit }) => subreddit.name),
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      votes: true,
      author: true,
      comments: true,
      subreddit: true,
    },
    take: NO_OF_INFINITE_SCROLL_RESULTS,
  });

  return <PostFeed initialPosts={posts} />;
};

export default CustomFeed;
