"use client"

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
import { useRouter } from "next/navigation"
import EnvironmentVariables from "./environment-variables"
import { EnvSchema } from "@/lib/schemas/environment-variables"
import { TokenSchema } from "@/lib/schemas/token"
import AgentBuilderSubmit, { agentBuilderOnSubmit } from "./submit"
import {
  Character,
  CharacterSchema,
  Clients,
  ModelProviderName,
} from "@/lib/schemas/character"

const borderStyle = "rounded-xl border border-black dark:border-white"

const stringListTitles = {
  "bio": "Biography",
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

const IntegrationsSchema = z.object({
  twitter: z.boolean(),
})

const NativeAgentBuilderSchema = z.intersection(
  CharacterSchema
  .merge(EnvSchema)
  .merge(IntegrationsSchema),
  TokenSchema,
)
type NativeAgentBuilderSchema = z.infer<typeof NativeAgentBuilderSchema>

function NativeAgentBuilder({
  defaultValues,
  agentId,
} : {
  defaultValues?: NativeAgentBuilderSchema,
  agentId?: string,
}) {
  const { user, primaryWallet: wallet } = useDynamicContext()

  const form = useForm<NativeAgentBuilderSchema>({
    resolver: zodResolver(NativeAgentBuilderSchema),
    defaultValues: defaultValues ?? {
      twitter: false,
      env: [{ key: "", value: "", }],
      name: "",
      clients: [],
      modelProvider: ModelProviderName.OPENAI,
      plugins: [],
      bio: [],
      lore: [],
      knowledge: [],
      messageExamples: [],
      postExamples: [],
      adjectives: [],
      topics: [],
      style: { all: [], chat: [], post: [], },
      isNewToken: true,
      tokenName: "TEMPORARY",
      ticker: "HOLDER",
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

  async function onSubmit(formData: NativeAgentBuilderSchema) {
    console.debug("AgentForm", formData)
    const {
      env,
      isNewToken,
      twitter,
      clients,
      ...data
    } = formData
    const character: Character = {
      clients: twitter ? [Clients.TWITTER, ...clients] : clients,
      ...data,
    }

    if (!user) throw new Error(`User ${user} does not exist!`)
    if (!user.userId) throw new Error(`User ${user} has no userId!`)

    return agentBuilderOnSubmit(agentId)({
      dynamicId: user.userId,
      character: CharacterSchema.strip().parse(character),
      envFile: (
        env
        .filter(({value}) => value.length)
        .map(({key, value}) => `${key}=${value}`)
        .join('\n')
      ),
      token: isNewToken ? formData : formData.tokenId,
      push,
      wallet,
    })
  }

  return ( user ?
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Accordion type="multiple" className="flex flex-col gap-2">
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
            <AccordionContent className="flex flex-col gap-8">
              <div className="flex flex-col gap-4">
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
                  <FormItem className="flex flex-row items-center justify-start gap-2">
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

          {/* { !agentId && <TokenAccordion /> } */}

        </Accordion>

        <AgentBuilderSubmit />
      </form>
    </Form> : 
    <h1>
      Please login to create an agent.
    </h1>
  )
}

function MessageExample({
  exampleIndex,
  control,
  parentRemove,
}: {
  exampleIndex: number,
  control: Control<NativeAgentBuilderSchema>,
  parentRemove: UseFieldArrayRemove,
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `messageExamples.${exampleIndex}`,
  })

  return (
    <div className={cn(borderStyle, "flex flex-col p-4 gap-8")}>
      <div className="flex flex-col gap-2">
      {fields.map((field, messageIndex) => (
        <div key={field.id} className={cn(borderStyle, "flex flex-col gap-8 p-4")}>
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

function Style({ control }: { control: Control<NativeAgentBuilderSchema> }) {
  const getFullName = (name: string) => `style.${name}`
  function StyleHelper({ name, title }: { name: string, title: string }) {
    const fullName = getFullName(name)
    const { fields, append, remove } = useFieldArray({
      // @ts-expect-error TS not recognizing other property types
      control, name: fullName,
    })
    return (
      <div className={cn(borderStyle, "flex flex-col gap-8 p-4")}>
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
      <AccordionContent className="flex flex-col gap-4">
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
  control: Control<NativeAgentBuilderSchema>,
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    // @ts-expect-error TS not recognizing other property types
    name, // TODO: figure out why name has weird type
  })

  return (
    <AccordionItem value={title}>
      <AccordionTrigger>{title}</AccordionTrigger>
      <AccordionContent className="flex flex-col gap-8">
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
  fields: FieldArrayWithId<NativeAgentBuilderSchema>[],
  remove: UseFieldArrayRemove,
}) {
  return (
    <div className="flex flex-col gap-4">
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

export default NativeAgentBuilder