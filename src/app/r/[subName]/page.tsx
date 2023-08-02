import { NO_OF_INFINITE_SCROLL_RESULTS } from "@/config";
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
        take: NO_OF_INFINITE_SCROLL_RESULTS,
      },
    },
  });
  if (!subreddit) return notFound();
  return <div>page</div>;
};

export default page;
