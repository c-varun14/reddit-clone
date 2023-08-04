"use client";

import { FC, useCallback, useEffect, useRef, useState } from "react";
import TextAreaAutoResize from "react-textarea-autosize";
import { useForm } from "react-hook-form";
import { createPostSchema, createPostType } from "@/lib/validators/post";
import { zodResolver } from "@hookform/resolvers/zod";
import type EditorJS from "@editorjs/editorjs";
import { uploadFiles } from "@/lib/uploadthing";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { toast } from "@/hooks/use-toast";
import { usePathname, useRouter } from "next/navigation";

interface EditorProps {
  subredditId: string;
}

const Editor: FC<EditorProps> = ({ subredditId }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<createPostType>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      subredditId,
      title: "",
      content: null,
    },
  });
  const pathname = usePathname();
  const router = useRouter();

  const { mutate: createPost, isLoading } = useMutation({
    mutationFn: async (payload: createPostType) => {
      const { data } = await axios.post("/api/subreddit/post/create", payload);
      console.log(data);
      return data;
    },
    onError: (err) => {
      if (err instanceof AxiosError) {
        if (err.response?.status === 400)
          return toast({
            title: err.response.data,
            description: `You should be a member of the subreddit to create posts`,
            variant: "destructive",
          });
      }
      toast({
        title: "Internal error",
        description: "Something went wrong! Please try again",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      const redirectLink = pathname.split("/").slice(0, -1).join("/");
      router.push(redirectLink);

      router.refresh();

      toast({
        description: "Your post has been created",
      });
    },
  });

  const editorRef = useRef<EditorJS>();
  const _titleRef = useRef<HTMLTextAreaElement>();
  const [isMounted, setisMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") setisMounted(true);
  }, []);

  const initializeEditor = useCallback(async () => {
    const EditorJS = (await import("@editorjs/editorjs")).default;
    const Header = (await import("@editorjs/header")).default;
    const Embed = (await import("@editorjs/embed")).default;
    const Table = (await import("@editorjs/table")).default;
    const List = (await import("@editorjs/list")).default;
    const Code = (await import("@editorjs/code")).default;
    const LinkTool = (await import("@editorjs/link")).default;
    const InlineCode = (await import("@editorjs/inline-code")).default;
    const ImageTool = (await import("@editorjs/image")).default;

    if (!editorRef.current) {
      const editor = new EditorJS({
        holder: "editor",
        onReady() {
          editorRef.current = editor;
        },
        placeholder: "Type here to write your post...",
        inlineToolbar: true,
        data: { blocks: [] },
        tools: {
          header: Header,
          linkTool: {
            class: LinkTool,
            config: {
              endpoint: "/api/link",
            },
          },
          image: {
            class: ImageTool,
            config: {
              uploader: {
                async uploadByFile(file: File) {
                  const [res] = await uploadFiles([file], "imageUploader");

                  return {
                    success: 1,
                    file: {
                      url: res.fileUrl,
                    },
                  };
                },
              },
            },
          },
          list: List,
          code: Code,
          inlineCode: InlineCode,
          table: Table,
          embed: Embed,
        },
      });
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await initializeEditor();
      setTimeout(() => {
        _titleRef.current?.focus();
      }, 0);
    };
    if (isMounted) {
      init();

      return () => {
        editorRef.current?.destroy();
        editorRef.current = undefined;
      };
    }
  });

  async function onSubmit(e: createPostType) {
    console.log("Submit handler running");
    const blocks = await editorRef.current?.save();

    const payload: createPostType = {
      title: e.title,
      content: blocks,
      subredditId,
    };

    createPost(payload);
  }

  const { ref: titleRef, ...titleRegisterProps } = register("title");

  return (
    <div className="w-full p-4 bg-zinc-50 rounded-lg border border-zinc-200">
      <form
        id="subreddit-post-form"
        className="w-fit"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="prose prose-stone dark:prose-invert">
          <TextAreaAutoResize
            ref={(e) => {
              titleRef(e);
              //@ts-ignore
              _titleRef.current = e;
            }}
            {...titleRegisterProps}
            placeholder="Title"
            className="w-full resize-none appearance-none overflow-hidden bg-transparent text-5xl font-bold focus:outline-none"
          />
          <div id="editor" className="min-h-[500px]" />
        </div>
      </form>
    </div>
  );
};

export default Editor;
