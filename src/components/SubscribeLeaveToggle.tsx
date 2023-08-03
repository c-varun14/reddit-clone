"use client";

import { FC, startTransition } from "react";
import { Button } from "./ui/Button";
import { useMutation } from "@tanstack/react-query";
import { subredditSubscribeType } from "@/lib/validators/subreddit";
import axios, { AxiosError } from "axios";
import { toast } from "@/hooks/use-toast";
import { useCustomToast } from "@/hooks/use-custom-toast";
import { useRouter } from "next/navigation";

interface SubscribeLeaveToggleProps {
  subredditId: string;
  isSubscribed: boolean;
  subName: string;
}

const SubscribeLeaveToggle: FC<SubscribeLeaveToggleProps> = ({
  isSubscribed,
  subredditId,
  subName,
}) => {
  const { loginToast } = useCustomToast();
  const router = useRouter();
  const { mutate, isLoading } = useMutation({
    mutationFn: async () => {
      const payload: subredditSubscribeType = {
        subredditId,
      };
      const { data } = await axios.post("/api/subreddit/subUnsub", payload);
      return data as string;
    },
    onError: (err) => {
      if (err instanceof AxiosError) {
        if (err.response?.status === 401) return loginToast();
        else if (err.response?.status === 400)
          return toast({
            title: err.response.data,
            description: "You cannot leave your own subreddit",
            variant: "destructive",
          });
        else if (err.response?.status === 422)
          return toast({
            title: err.response.data,
            description: "Enter data that contains the subredditId and userId",
            variant: "destructive",
          });
      }

      return toast({
        title: "Internal error",
        description: "Something went wrong, please try again",
      });
    },
    onSuccess: (success) => {
      startTransition(() => {
        router.refresh();
      });
      if (success === "Subscribed")
        return toast({
          title: "Subscribed",
          description: `You are now subscribed to r/${subName}`,
        });
      return toast({
        title: "Unsubscribed",
        description: `You are now not a member of r/${subName}`,
      });
    },
  });

  return isSubscribed ? (
    <Button
      onClick={() => mutate()}
      className="w-full mt-1 mb-4"
      isLoading={isLoading}
    >
      Leave community
    </Button>
  ) : (
    <Button
      onClick={() => mutate()}
      isLoading={isLoading}
      className="w-full mt-1 mb-4"
    >
      Join to post
    </Button>
  );
};

export default SubscribeLeaveToggle;
