import { RefObject, useEffect } from "react";

type Event = MouseEvent | TouchEvent;

export const useOnClickOutside = <T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: Event) => void
) => {
  useEffect(() => {
    const handleClick = (event: any) => {
      const isOutsideClick = !ref.current?.contains(event.target);
      const isScrollBarClick =
        event.target.scrollHeight > event.target.clientHeight &&
        event.clientX > event.target.clientWidth;

      if (isOutsideClick && !isScrollBarClick) {
        handler(event);
      }
    };

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [ref, handler]);
};
