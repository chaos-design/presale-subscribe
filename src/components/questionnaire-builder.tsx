"use client"

import { gsap } from "gsap"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ListChecksIcon,
  ListPlusIcon,
  PlusIcon,
  TextCursorInputIcon,
  Trash2Icon,
} from "lucide-react"
import { useLayoutEffect, useRef } from "react"

import { FieldLabelWithCount } from "@/components/field-label-with-count"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type {
  CampaignQuestion,
  CampaignQuestionnaire,
  CampaignQuestionType,
} from "@/types/database"

const questionTypeOptions: Array<{
  value: CampaignQuestionType
  label: string
  icon: typeof TextCursorInputIcon
}> = [
  { value: "short_text", label: "简短回答", icon: TextCursorInputIcon },
  { value: "single_choice", label: "单选", icon: ListChecksIcon },
  { value: "multiple_choice", label: "多选", icon: ListPlusIcon },
]

function createQuestion(index: number): CampaignQuestion {
  return {
    id: `question-${crypto.randomUUID()}`,
    label: `第 ${index + 1} 个问题`,
    type: "short_text",
    required: false,
    placeholder: "写下你的回答",
    options: [],
  }
}

function QuestionIconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            onClick={onClick}
            aria-label={label}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function QuestionnaireBuilder({
  questionnaire,
  onChange,
}: {
  questionnaire: CampaignQuestionnaire
  onChange: (questionnaire: CampaignQuestionnaire) => void
}) {
  const listRef = useRef<HTMLDivElement>(null)
  const previousQuestionIds = useRef(questionnaire.questions.map((question) => question.id))

  useLayoutEffect(() => {
    const previousIds = new Set(previousQuestionIds.current)
    const addedQuestion = questionnaire.questions.find((question) => !previousIds.has(question.id))
    previousQuestionIds.current = questionnaire.questions.map((question) => question.id)

    if (!addedQuestion || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return
    }

    const element = listRef.current?.querySelector<HTMLElement>(
      `[data-question-id="${addedQuestion.id}"]`
    )

    if (!element) {
      return
    }

    const context = gsap.context(() => {
      gsap.fromTo(
        element,
        { autoAlpha: 0, x: -18 },
        { autoAlpha: 1, x: 0, duration: 0.42, ease: "power3.out" }
      )
    }, listRef)

    return () => context.revert()
  }, [questionnaire.questions])

  function updateQuestion(questionId: string, updates: Partial<CampaignQuestion>) {
    onChange({
      ...questionnaire,
      questions: questionnaire.questions.map((question) =>
        question.id === questionId ? { ...question, ...updates } : question
      ),
    })
  }

  function updateQuestionType(question: CampaignQuestion, type: CampaignQuestionType) {
    updateQuestion(question.id, {
      type,
      options:
        type === "short_text"
          ? []
          : question.options.length >= 2
            ? question.options
            : ["选项 A", "选项 B"],
    })
  }

  function moveQuestion(index: number, offset: -1 | 1) {
    const destination = index + offset
    if (destination < 0 || destination >= questionnaire.questions.length) {
      return
    }

    const questions = [...questionnaire.questions]
    const [question] = questions.splice(index, 1)
    questions.splice(destination, 0, question)
    onChange({ ...questionnaire, questions })
  }

  function removeQuestion(questionId: string) {
    onChange({
      ...questionnaire,
      questions: questionnaire.questions.filter((question) => question.id !== questionId),
    })
  }

  function updateOption(question: CampaignQuestion, optionIndex: number, value: string) {
    const options = [...question.options]
    options[optionIndex] = value
    updateQuestion(question.id, { options })
  }

  function removeOption(question: CampaignQuestion, optionIndex: number) {
    updateQuestion(question.id, {
      options: question.options.filter((_, index) => index !== optionIndex),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="border-y py-4">
        <div>
          <div className="campaign-module-title-row">
            <p className="text-sm font-medium">收集预约问卷</p>
            <Switch
              size="sm"
              checked={questionnaire.enabled}
              onCheckedChange={(enabled) => onChange({ ...questionnaire, enabled })}
              aria-label="启用预约问卷"
            />
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            答案会和邮箱一起进入预约名单，并锁定在发布快照中。
          </p>
        </div>
      </div>

      <FieldGroup className={questionnaire.enabled ? undefined : "opacity-55"}>
        <Field data-preview-source="questionnaire-title">
          <FieldLabelWithCount
            htmlFor="questionnaire-title"
            count={questionnaire.title.length}
            max={80}
          >
            问卷标题
          </FieldLabelWithCount>
          <Input
            id="questionnaire-title"
            value={questionnaire.title}
            onChange={(event) => onChange({ ...questionnaire, title: event.target.value })}
            maxLength={80}
            disabled={!questionnaire.enabled}
          />
        </Field>
        <Field data-preview-source="questionnaire-description">
          <FieldLabelWithCount
            htmlFor="questionnaire-description"
            count={questionnaire.description.length}
            max={240}
          >
            问卷说明
          </FieldLabelWithCount>
          <Textarea
            id="questionnaire-description"
            value={questionnaire.description}
            onChange={(event) => onChange({ ...questionnaire, description: event.target.value })}
            maxLength={240}
            rows={3}
            disabled={!questionnaire.enabled}
          />
        </Field>
      </FieldGroup>

      <div ref={listRef} className="flex flex-col border-t">
        {questionnaire.questions.map((question, index) => {
          const typeOption = questionTypeOptions.find((option) => option.value === question.type)
          const TypeIcon = typeOption?.icon ?? TextCursorInputIcon

          return (
            <article
              key={question.id}
              className="border-b py-5"
              data-question-id={question.id}
              data-preview-source={`question-${question.id}`}
            >
              <header className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-primary">
                    Q{String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="h-3 border-l" />
                  <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <TypeIcon className="size-3" aria-hidden="true" />
                    {typeOption?.label}
                  </span>
                </div>
                <div className="flex items-center">
                  <QuestionIconButton
                    label="上移问题"
                    disabled={index === 0 || !questionnaire.enabled}
                    onClick={() => moveQuestion(index, -1)}
                  >
                    <ArrowUpIcon aria-hidden="true" />
                  </QuestionIconButton>
                  <QuestionIconButton
                    label="下移问题"
                    disabled={
                      index === questionnaire.questions.length - 1 || !questionnaire.enabled
                    }
                    onClick={() => moveQuestion(index, 1)}
                  >
                    <ArrowDownIcon aria-hidden="true" />
                  </QuestionIconButton>
                  <QuestionIconButton
                    label="删除问题"
                    disabled={!questionnaire.enabled}
                    onClick={() => removeQuestion(question.id)}
                  >
                    <Trash2Icon aria-hidden="true" />
                  </QuestionIconButton>
                </div>
              </header>

              <div className="mt-4 grid gap-4">
                <Field>
                  <FieldLabel htmlFor={`${question.id}-label`}>问题</FieldLabel>
                  <Input
                    id={`${question.id}-label`}
                    value={question.label}
                    onChange={(event) => updateQuestion(question.id, { label: event.target.value })}
                    maxLength={120}
                    disabled={!questionnaire.enabled}
                  />
                </Field>
                <div className="grid grid-cols-[1fr_auto] items-end gap-4">
                  <Field>
                    <FieldLabel>回答方式</FieldLabel>
                    <Select
                      items={questionTypeOptions}
                      value={question.type}
                      onValueChange={(value) => {
                        if (value) {
                          updateQuestionType(question, value)
                        }
                      }}
                      disabled={!questionnaire.enabled}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          <TypeIcon aria-hidden="true" />
                          {typeOption?.label}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent align="start">
                        <SelectGroup>
                          {questionTypeOptions.map((option) => {
                            const Icon = option.icon
                            return (
                              <SelectItem key={option.value} value={option.value}>
                                <Icon aria-hidden="true" />
                                {option.label}
                              </SelectItem>
                            )
                          })}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <div className="flex h-8 items-center gap-2 text-xs">
                    <Switch
                      size="sm"
                      checked={question.required}
                      onCheckedChange={(required) => updateQuestion(question.id, { required })}
                      disabled={!questionnaire.enabled}
                      aria-label={`${question.label}设为必填`}
                    />
                    必填
                  </div>
                </div>

                {question.type === "short_text" ? (
                  <Field>
                    <FieldLabel htmlFor={`${question.id}-placeholder`}>输入提示</FieldLabel>
                    <Input
                      id={`${question.id}-placeholder`}
                      value={question.placeholder}
                      onChange={(event) =>
                        updateQuestion(question.id, { placeholder: event.target.value })
                      }
                      maxLength={120}
                      disabled={!questionnaire.enabled}
                    />
                  </Field>
                ) : (
                  <Field>
                    <FieldLabelWithCount count={question.options.length} max={8}>
                      选项
                    </FieldLabelWithCount>
                    <div className="grid gap-2">
                      {question.options.map((option, optionIndex) => (
                        <div
                          key={`${question.id}-${optionIndex}`}
                          className="grid grid-cols-[18px_1fr_32px] items-center gap-2"
                        >
                          <span className="font-mono text-[9px] text-muted-foreground">
                            {String(optionIndex + 1).padStart(2, "0")}
                          </span>
                          <Input
                            value={option}
                            onChange={(event) =>
                              updateOption(question, optionIndex, event.target.value)
                            }
                            maxLength={60}
                            aria-label={`${question.label}选项 ${optionIndex + 1}`}
                            disabled={!questionnaire.enabled}
                          />
                          <QuestionIconButton
                            label={`删除选项 ${optionIndex + 1}`}
                            disabled={!questionnaire.enabled || question.options.length <= 2}
                            onClick={() => removeOption(question, optionIndex)}
                          >
                            <Trash2Icon aria-hidden="true" />
                          </QuestionIconButton>
                        </div>
                      ))}
                      <div className="flex justify-end">
                        <QuestionIconButton
                          label="添加选项"
                          disabled={!questionnaire.enabled || question.options.length >= 8}
                          onClick={() =>
                            updateQuestion(question.id, {
                              options: [
                                ...question.options,
                                `选项 ${String.fromCharCode(65 + question.options.length)}`,
                              ],
                            })
                          }
                        >
                          <PlusIcon aria-hidden="true" />
                        </QuestionIconButton>
                      </div>
                    </div>
                  </Field>
                )}
              </div>
            </article>
          )
        })}
      </div>

      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] text-muted-foreground">
          {questionnaire.questions.length} / 6
        </span>
        <QuestionIconButton
          label="添加问题"
          disabled={!questionnaire.enabled || questionnaire.questions.length >= 6}
          onClick={() =>
            onChange({
              ...questionnaire,
              questions: [
                ...questionnaire.questions,
                createQuestion(questionnaire.questions.length),
              ],
            })
          }
        >
          <PlusIcon aria-hidden="true" />
        </QuestionIconButton>
      </div>
    </div>
  )
}
