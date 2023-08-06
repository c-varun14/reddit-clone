import { db } from "@/lib/db";
import PostFeed from "./PostFeed";
import { NO_OF_INFINITE_SCROLL_RESULTS } from "@/config";

const GeneralFeed = async () => {
  const posts = await db.post.findMany({
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

export default GeneralFeed;
