"use client"

import { EyeIcon, EyeOffIcon } from "lucide-react"
import { useState } from "react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

export function PasswordInput({
  id,
  name,
  autoComplete,
  placeholder,
  value,
  onChange,
  ariaInvalid = false,
}: {
  id: string
  name: string
  autoComplete: "current-password" | "new-password"
  placeholder?: string
  value: string
  onChange: (value: string) => void
  ariaInvalid?: boolean
}) {
  const [visible, setVisible] = useState(false)

  return (
    <InputGroup className="h-11">
      <InputGroupInput
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="h-full placeholder:text-xs"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={ariaInvalid}
        minLength={8}
        maxLength={72}
        required
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          aria-label={visible ? "隐藏密码" : "显示密码"}
          title={visible ? "隐藏密码" : "显示密码"}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOffIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}
