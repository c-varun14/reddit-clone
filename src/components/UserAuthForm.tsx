"use client";

import { FC, useState } from "react";
import { Button } from "./ui/Button";
import { cx } from "class-variance-authority";
import { signIn } from "next-auth/react";
import { toast } from "@/hooks/use-toast";
import { Icons } from "./Icons";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {}

const UserAuthForm: FC<UserAuthFormProps> = ({ className, ...props }) => {
  const [isLoading, setIsLoading] = useState(false);

  const loginWithGoogle = async () => {
    try {
      await signIn("google");
    } catch (err) {
      toast({
        title: "Error",
        description: "There was an error logging in with Google",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      onClick={loginWithGoogle}
      className={cx("flex justify-center", className)}
      {...props}
    >
      <Button
        isLoading={isLoading}
        type="button"
        size="sm"
        className="w-full"
        disabled={isLoading}
      >
        {!isLoading && <Icons.google className="h-4 w-4 mr-2" />}
        Google
      </Button>
    </div>
  );
};

export default UserAuthForm;
