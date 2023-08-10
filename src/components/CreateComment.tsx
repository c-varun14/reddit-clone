"use client";

import { useMutation } from "@tanstack/react-query";
import { FC, useState } from "react";
import { CommentRequest } from "../lib/validators/comment";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/Button";
import { Label } from "./ui/label";

interface CreateCommentProps {
  postId: string;
  replyToId?: string;
}

const CreateComment: FC<CreateCommentProps> = ({ postId, replyToId }) => {
  const [input, setInput] = useState("");
  const router = useRouter();

  const { isLoading, mutate: createComment } = useMutation({
    mutationFn: async (payload: CommentRequest) => {
      const { data } = await axios.patch(
        "/api/subreddit/post/comment/",
        payload
      );
      return data;
    },
    onError: () => {
      return toast({
        title: "Something went wrong.",
        description: "Comment wasn't created successfully. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      router.refresh();
      setInput("");
    },
  });
  return (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="comment">Your comment</Label>
      <div className="mt-2">
        <Textarea
          id="comment"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={1}
          placeholder="What are your thoughts?"
        />

        <div className="mt-2 flex justify-end">
          <Button
            isLoading={isLoading}
            disabled={input.length === 0}
            onClick={() => createComment({ postId, text: input, replyToId })}
          >
            Post
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateComment;
