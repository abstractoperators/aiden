"use client"

import { Character, characterSchema } from "@/lib/character"
import { cn } from "@/lib/utils"
import { useDynamicContext } from "@dynamic-labs/sdk-react-core"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import {
  useForm,
  useFieldArray,
  Control,
  UseFieldArrayRemove,
  FieldArrayWithId,
} from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  createAgent,
  stopAgent,
  Token,
  updateAgent,
} from "@/lib/api/agent"
import { toast } from "@/hooks/use-toast"
import { getUser } from "@/lib/api/user"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { isErrorResult, isSuccessResult } from "@/lib/api/result"
import { FormCombobox } from "./ui/combobox"
import { useEffect, useState } from "react"
import { getTokens } from "@/lib/api/token"

const borderStyle = "rounded-xl border border-black dark:border-white"

const stringListTitles = {
  "bio": "Biography",
  "lore": "Lore",
  "knowledge": "Knowledge",
  "postExamples": "Post Examples",
  "adjectives": "Adjectives",
  "topics": "Topics",
}
const messageExampleTitles = {
  "user": "User",
  "content.text": "Text",
  "context.action": "Action (Optional)",
}
const styleTitles = {
  "all": "All",
  "chat": "Chat",
  "post": "Post",
}

const envSchema = z.object({
  env: z.string(),
})
const integrationsSchema = z.object({
  twitter: z.boolean()
})
const tokenSchema = z.object({
  tokenId: z.string().nullable().optional(),
})

const formSchema = (
  characterSchema
  .merge(envSchema)
  .merge(integrationsSchema)
  .merge(tokenSchema)
)
type FormType = z.infer<typeof formSchema>

function AgentForm({
  defaultValues,
  agentId,
} : {
  defaultValues?: FormType,
  agentId?: string,
}) {
  const { user } = useDynamicContext()
  if (!user)
    throw new Error(`User ${user} does not exist!`)
  if (!user.userId)
    throw new Error(`User ${user} has no userId!`)
  const userId: string = user.userId

  const form = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues ?? {
      twitter: false,
      env: "",
      name: "",
      bio: [],
      lore: [],
      knowledge: [],
      messageExamples: [],
      postExamples: [],
      adjectives: [],
      topics: [],
      style: { all: [], chat: [], post: [], },
    }
  })
  const { control, handleSubmit } = form
  const {
    fields: messageExamplesFields,
    append: messageExamplesAppend,
    remove: messageExamplesRemove,
  } = useFieldArray({
    control,
    name: "messageExamples",
  })

  const { push } = useRouter()

  // TODO: set up sei and eth addresses if undefined
  const onSubmitBase = agentId ? onSubmitEdit(agentId) : onSubmitCreate

  async function onSubmit(formData: FormType) {
    console.debug("AgentForm", formData)
    const { env: envFile, tokenId, twitter, ...data } = formData
    const character = {
      modelProvider: "openai",
      clients: twitter ? ["twitter"] : [],
      settings: { secrets: {} },
      plugins: [],
      ...data,
    }

    return onSubmitBase({
      dynamicId: userId,
      character,
      envFile,
      tokenId,
      push,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Accordion type="multiple" className="space-y-2">
          <AccordionItem value="Name">
            <AccordionTrigger>Name</AccordionTrigger>
            <AccordionContent>
              <FormField
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel></FormLabel>
                    <FormControl>
                      <Input
                        className="placeholder:text-neutral-400"
                        placeholder="Name"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Name of the agent being built</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>

          {Object.entries(stringListTitles).map(([name, title]) => (
            <AccordionList
              key={name}
              title={title}
              name={name}
              control={control}
            />
          ))}

          <AccordionItem value="Message Examples">
            <AccordionTrigger>
              Message Examples
            </AccordionTrigger>
            <AccordionContent className="space-y-8">
              <div className="space-y-4">
              {messageExamplesFields.map((example, exampleIndex) => (
                <MessageExample
                  key={example.id}
                  control={control}
                  exampleIndex={exampleIndex}
                  parentRemove={messageExamplesRemove}
                />
              ))}
              </div>
              <Button
                type="button"
                onClick={() =>
                  messageExamplesAppend([[{ user: "", content: { text: "", action: "" } }]])
                }
              >
                Add Message Example
              </Button>
            </AccordionContent>
          </AccordionItem>

          <Style control={control} />
          <EnvironmentVariables />

          <AccordionItem value="Twitter">
            <AccordionTrigger>Twitter</AccordionTrigger>
            <AccordionContent>
              <FormField
                name="twitter"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-start space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!my-2">Connect the agent to Twitter</FormLabel>
                    <FormDescription></FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>

          <TokenAccordion />

        </Accordion>

        <SubmitButton />
      </form>
    </Form>
  )
}

function MessageExample({
  exampleIndex,
  control,
  parentRemove,
}: {
  exampleIndex: number,
  control: Control<FormType>,
  parentRemove: UseFieldArrayRemove,
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `messageExamples.${exampleIndex}`,
  })

  return (
    <div className={cn(borderStyle, "p-4 space-y-8")}>
      <div className="space-y-2">
      {fields.map((field, messageIndex) => (
        <div key={field.id} className={cn(borderStyle, "space-y-8 p-4")}>
          <div>
          {Object.entries(messageExampleTitles).map(([name, title]) => (
            <FormField
              key={`messageExamples.${exampleIndex}.${messageIndex}.${name}`}
              name={`messageExamples.${exampleIndex}.${messageIndex}.${name}`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{title}</FormLabel>
                  <FormControl>
                    <Input
                      className="placeholder:text-neutral-400"
                      placeholder={title}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription />
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          </div>
          <Button type="button" variant="destructive" onClick={() => remove(messageIndex)}>
            Remove Message
          </Button>
        </div>
      ))}
      </div>
      <div className="flex flex-row justify-between">
        <Button
          type="button"
          onClick={() => append([{ user: "", content: { text: "", action: "" } }])}
        >
          Add Message
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => parentRemove(exampleIndex)}
        >
          Remove Example
        </Button>
      </div>
    </div>
  )
}

function Style({ control }: { control: Control<FormType> }) {
  const getFullName = (name: string) => `style.${name}`
  function StyleHelper({ name, title }: { name: string, title: string }) {
    const fullName = getFullName(name)
    const { fields, append, remove } = useFieldArray({
      // @ts-expect-error TS not recognizing other property types
      control, name: fullName,
    })
    return (
      <div className={cn(borderStyle, "space-y-8 p-4")}>
        <h3 className="font-semibold">{title}</h3>
        <FieldArray name={fullName} title={title} fields={fields} remove={remove} />
        {/* @ts-expect-error TS not recognizing other property types */}
        <Button type="button" onClick={() => append([" "])}>Add {title}</Button>
        {/* TODO: figure out why empty string yields unexpected behavior */}
      </div>
    )
  }

  return (
    <AccordionItem value="Style">
      <AccordionTrigger>Style</AccordionTrigger>
      <AccordionContent className="space-y-4">
      {Object.entries(styleTitles).map(([ name, title ]) => (
        <StyleHelper key={getFullName(name)} name={name} title={title} />
      ))}
      </AccordionContent>
    </AccordionItem>
  )
}

function AccordionList({
  title,
  name,
  control,
}: {
  title: string,
  name: string,
  control: Control<FormType>,
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    // @ts-expect-error TS not recognizing other property types
    name, // TODO: figure out why name has weird type
  })

  return (
    <AccordionItem value={title}>
      <AccordionTrigger>{title}</AccordionTrigger>
      <AccordionContent className="space-y-8">
        <FieldArray name={name} title={title} fields={fields} remove={remove} />
        {/* @ts-expect-error TS not recognizing other property types */}
        <Button type="button" onClick={() => append([" "])}>Add {title}</Button>
        {/* TODO: figure out why empty string yields unexpected behavior */}
      </AccordionContent>
    </AccordionItem>
  )
}

function FieldArray({
  name,
  title,
  fields,
  remove,
}: {
  name: string,
  title: string,
  fields: FieldArrayWithId<FormType>[],
  remove: UseFieldArrayRemove,
}) {
  return (
    <div className="space-y-4">
    {fields.map((formField, index) => (
      <FormField
        key={formField.id}
        name={`${name}.${index}`}
        render={({ field }) => (
          <FormItem>
            <FormLabel></FormLabel>
            <FormControl>
              <Input
                className="placeholder:text-neutral-400"
                placeholder={title}
                {...field}
              />
            </FormControl>
            <FormDescription />
            <FormMessage />
            <Button type="button" variant="destructive" onClick={() => remove(index)}>
              Remove
            </Button>
          </FormItem>
        )}
      />
    ))}
    </div>
  )
}

function EnvironmentVariables() {
  return (
    <AccordionItem value="Environment Variables">
      <AccordionTrigger>
        Environment Variables
      </AccordionTrigger>
      <AccordionContent>
        <FormField
          name="env"
          render={({ field }) => (
            <FormItem>
              <FormLabel></FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Environment Variables"
                  {...field}
                />
              </FormControl>
              <FormDescription>Copy-paste your .env file here.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </AccordionContent>
    </AccordionItem>
  )
}

function TokenAccordion() {
  const [tokens, setTokens] = useState<Token[]>([])
  useEffect(() => {
    getTokens().then(result => {
      if (isSuccessResult(result)) {
        setTokens(result.data)
      } else { toast({
        title: "Unable to fetch tokens!",
        description: result.message,
      })}
    })
  }, [])

  return (
    <AccordionItem value="Token">
      <AccordionTrigger>Token</AccordionTrigger>
      <AccordionContent>
        <FormField
          name="tokenId"
          render={({ field: { value, onChange } }) => (
            <FormItem>
              <FormLabel></FormLabel>
                <FormCombobox
                  value={value}
                  setValue={onChange}
                  instructions="Select a token..."
                  empty="No tokens found."
                  search="Search tokens..."
                  items={tokens.map(token => ({
                    label: `${token.name} ($${token.ticker})`,
                    value: token.id,
                  }))}
                />
              <FormDescription>
                Link a token actual uuid here.
                <Link
                  href="/tokens"
                  className={cn(
                    "text-blue-600 underline text-sm mt-1",
                    "hover:text-blue-700 dark:hover:text-blue-500",
                    "transition duration-300",
                    "inline-block",
                  )}
                >
                  Need to find a token? Click here.
                </Link>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </AccordionContent>
    </AccordionItem>
  )
}

function SubmitButton() {
  return (
    <Button
      className={cn(
        "bg-gradient-to-br from-anakiwa dark:from-anakiwa-dark from-20% to-carnation dark:to-carnation-dark to-80%",
        "font-semibold text-black dark:text-white text-d5",
        "transition duration-300 hover:hue-rotate-60",
        "px-12 py-8 rounded-xl",
      )}
      type="submit"
    >
      Submit
    </Button>
  )
}

interface SubmitProps {
  dynamicId: string
  character: Character
  envFile: string
  tokenId?: string | null
  push: (href: string, options?: { scroll: boolean }) => void
}

async function onSubmitCreate({
  dynamicId,
  character,
  envFile,
  tokenId,
  push,
}: SubmitProps) {
  console.debug("Character", character)
  const userResult = await getUser({ dynamicId })
  console.debug(dynamicId, userResult)

  if (isErrorResult(userResult)) {
    toast({
      title: "Unable to retrieve AIDN user!",
      description: userResult.message,
    })
    return
  }

  const agentPayload = {
    ownerId: userResult.data.id,
    characterJson: character,
    envFile,
    tokenId,
  }
  const agentResult = await createAgent(agentPayload)
  if (isErrorResult(agentResult)) {
    toast({
      title: `Unable to create Agent ${character.name}!`,
      description: agentResult.message,
    })
    return
  }

  toast({
    title: `Agent ${character.name} Created!`,
  })
  const { id } = agentResult.data
  push(`/agents/${id}`)
}

function onSubmitEdit(agentId: string) {
  async function onSubmitEditHelper({
    dynamicId,
    character,
    envFile,
    tokenId,
    push,
  }: SubmitProps) {
    console.debug("Character", character)
    const userResult = await getUser({ dynamicId })
    console.debug(dynamicId, userResult)

    if (isErrorResult(userResult)) {
      toast({
        title: "Unable to retrieve AIDN user!",
        description: userResult.message,
      })
      return
    }

    const agentPayload = {
      ownerId: userResult.data.id,
      characterJson: character,
      envFile,
      tokenId,
    }

    // update and stop agent
    const updateResult = await updateAgent(agentId, agentPayload)
    if (isErrorResult(updateResult)) {
      toast({
        title: `Unable to update Agent ${character.name}`,
        description: updateResult.message,
      })
      return
    }

    const stopResult = await stopAgent(agentId)
    if (isErrorResult(stopResult)) {
      console.error(`Failed to stop Agent ${agentId} status code ${stopResult.code}, ${stopResult.message}`)
      toast({
        title: `Unable to stop Agent ${character.name}`,
        description: stopResult.message,
      })
      return
    }
    toast({
      title: `Agent ${character.name} Updated!`,
      description: "Agent has been updated and stopped.",
    })

    push(`/agents/${agentId}`)
  }

  return onSubmitEditHelper
}

export {
  envSchema,
  onSubmitCreate,
  onSubmitEdit,
  EnvironmentVariables,
  SubmitButton,
  TokenAccordion,
}

export default AgentForm