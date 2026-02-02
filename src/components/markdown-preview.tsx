"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownPreviewProps = {
  children: string;
};

export function MarkdownPreview({ children }: MarkdownPreviewProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: (props) => (
          // eslint-disable-next-line jsx-a11y/anchor-has-content
          <a {...props} target="_blank" rel="noreferrer" className="text-foreground">
            {props.children}
          </a>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
