import { PromptInputButton, type PromptInputButtonProps,  } from "./ai-elements/prompt-input";

interface InputProps extends PromptInputButtonProps {
  onClick: () => void
  label: string
}

export function InputPrompt({ onClick, label, ...props }: InputProps) {
  return (
    <PromptInputButton className="w-max p-2" onClick={onClick} {...props}>
      {label}
    </PromptInputButton>
  )
}