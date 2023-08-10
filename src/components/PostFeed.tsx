"use client";

import { ExtendedPost } from "@/types/db";
import { FC, useEffect, useRef } from "react";
import { useIntersection } from "@mantine/hooks";
import { useInfiniteQuery } from "@tanstack/react-query";
import { NO_OF_INFINITE_SCROLL_RESULTS } from "@/config";
import axios from "axios";
import { useSession } from "next-auth/react";
import Post from "./Post";
import Loading from "@/app/loading";

interface PostFeedProps {
  initialPosts: ExtendedPost[];
  subredditName?: string;
}

const PostFeed: FC<PostFeedProps> = ({ initialPosts, subredditName }) => {
  const lastPostRef = useRef<HTMLElement>(null);
  const { ref, entry } = useIntersection({
    root: lastPostRef.current,
    threshold: 1,
  });
  const { data: session } = useSession();

  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery(
    ["infinite-query"],
    async ({ pageParam = 1 }) => {
      const getQueryUrl =
        `/api/posts?limit=${NO_OF_INFINITE_SCROLL_RESULTS}&page=${pageParam}` +
        (!!subredditName ? `&subredditName=${subredditName}` : "");

      const { data } = await axios.get(getQueryUrl);
      return data as ExtendedPost[];
    },
    {
      getNextPageParam: (lastPage, pages) => {
        const nextPage =
          lastPage.length === NO_OF_INFINITE_SCROLL_RESULTS
            ? pages.length + 1
            : undefined;
        return nextPage;
      },
      initialData: { pages: [initialPosts], pageParams: [1] },
    }
  );

  useEffect(() => {
    if (entry?.isIntersecting) {
      fetchNextPage();
    }
  }, [entry, fetchNextPage]);

  const posts = data?.pages.flatMap((page) => page) ?? initialPosts;

  return (
    <ul className="flex flex-col col-span-2 space-y-6">
      {posts.map((post) => {
        const votesAmt = post.votes.reduce((acc, vote) => {
          if (vote.type === "UP") return acc + 1;
          else if (vote.type === "DOWN") return acc - 1;
          return acc;
        }, 0);

        const userVote = post.votes.find(
          (vote) => vote.userId === session?.user.id
        );
        return (
          <Post
            currentVote={userVote}
            votesAmt={votesAmt}
            commentAmt={post.comments.length}
            post={post}
            key={post.id}
            subredditName={post.subreddit.name}
          />
        );
      })}
      {hasNextPage ? (
        <li className="text-center" key={0} ref={ref}>
          <Loading />
        </li>
      ) : null}
    </ul>
  );
};

export default PostFeed;
