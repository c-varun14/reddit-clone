import MiniCreatePost from "@/components/MiniCreatePost";
import PostFeed from "@/components/PostFeed";
import { NO_OF_INFINITE_SCROLL_RESULTS } from "@/config";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { FC } from "react";

interface pageProps {
  params: {
    subName: string;
  };
}

/** @ts-expect-error **/
const page: FC<pageProps> = async ({ params: { subName } }) => {
  const session = await getAuthSession();

  const subreddit = await db.subreddit.findFirst({
    where: { name: subName },
    include: {
      posts: {
        include: {
          author: true,
          comments: true,
          votes: true,
          subreddit: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: NO_OF_INFINITE_SCROLL_RESULTS,
      },
    },
  });
  if (!subreddit) return notFound();
  return (
    <>
      <h1 className="font-bold text-3xl md:text-4xl h-14">
        r/{subreddit.name}
      </h1>
      <MiniCreatePost session={session} />
      <PostFeed initialPosts={subreddit.posts} subredditName={subreddit.name} />
    </>
  );
};

export default page;
