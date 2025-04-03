'use client'

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Control,
  FieldArrayWithId,
  useFieldArray,
  UseFieldArrayRemove,
  useForm,
} from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDynamicContext, UserProfile } from "@dynamic-labs/sdk-react-core"
import { getUser } from "@/lib/api/user";
import {
  createAgent,
  getAgentStartTaskStatus,
  startAgent,
} from "@/lib/api/agent";
import {
  createRuntime,
  getRuntimes,
  Runtime,
} from "@/lib/api/runtime";
import { TaskStatus } from "@/lib/api/task";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

const borderStyle = "rounded-xl border border-black dark:border-white"
const accordionItemStyle = "data-[state=open]:bg-anakiwa-lighter/70 data-[state=open]:dark:bg-anakiwa-darker/70 rounded-xl px-4"

const envSchema = z.object({
  env: z.string(),
})

const MAX_FILE_SIZE = 5000000;
const uploadSchema = z.object({
  characterFile: z
    .instanceof(File)
    .refine(file => file.size !== 0, "File may not be empty.")
    .refine(file => file.size < MAX_FILE_SIZE, "Max file size is 5MB.")
    .refine(file =>
      [
        ".json",
        "application/json",
      ].includes(file.type),
      { message: "Invalid file type, must be JSON." }
    ),
    // TODO validate against Character JSON schema
}).merge(envSchema)
type UploadType = z.infer<typeof uploadSchema>

const stringListTitles = {
  "bio": "Biography",
  "lore": "Lore",
  "knowledge": "Knowledge",
  "postExamples": "Post Examples",
  "adjectives": "Adjectives",
  "topics": "Topics",
 }
const stringListSchema = z.object({
  bio: z.string().trim().min(2, "Cannot be empty").array().min(1),
  lore: z.string().trim().min(2, "Cannot be empty").array(),
  knowledge: z.string().trim().min(2, "Cannot be empty").array().optional(),
  postExamples: z.string().trim().min(2, "Cannot be empty").array(),
  adjectives: z.string().trim().min(2, "Cannot be empty").array(),
  topics: z.string().trim().min(2, "Cannot be empty").array(),
})

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
const characterSchema = z.object({
  name: z.string().trim().min(1, "Cannot be empty"),
  messageExamples: z.object({
    user: z.string().trim().min(1, "Cannot be empty"),
    content: z.object({
      text: z.string().trim().min(1, "Cannot be empty"),
      action: z.string().trim().min(1, "Cannot be empty").optional(),
    })
  }).array().array(),
  style: z.object({
    all: z.string().trim().min(2, "Cannot be empty").array(),
    chat: z.string().trim().min(2, "Cannot be empty").array(),
    post: z.string().trim().min(2, "Cannot be empty").array(),
  }),
}).merge(stringListSchema)

const integrationsSchema = z.object({
  twitter: z.boolean()
})

const createSchema = characterSchema.merge(envSchema).merge(integrationsSchema)
type CreateType = z.infer<typeof createSchema>

function CreateForm() {
  const { user } = useDynamicContext()
  if (!user)
    throw new Error(`User ${user} does not exist!`)
  if (!user.userId)
    throw new Error(`User ${user} has no userId!`)

  const form = useForm<CreateType>({
    resolver: zodResolver(createSchema),
    defaultValues: {
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
      style: { all: [], chat: [], post: [], }
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

  // TODO: set up sei and eth addresses if undefined

  async function onSubmit(formData: CreateType) {
    console.debug("CreateForm", formData)
    try {
      const apiUser = await getUser({
        // TS not able to use user assertion from outside of function
        dynamicId: (user as UserProfile).userId as string
      })

      // TODO
      const {env: envFile, twitter, ...data} = formData
      const characterJson = {
        modelProvider: "openai",
        clients: twitter ? ["twitter"] : [],
        settings: {
          secrets: {}
        },
        plugins: [],
        ...data,
      }

      console.debug("Character JSON", characterJson)

      const agentPayload = {
        ownerId: apiUser.id,
        characterJson: characterJson,
        envFile,
      }

      const agent = await createAgent(agentPayload)
      const unusedRuntimes = await getRuntimes()
      // if no unused runtime, get a random one
      // TODO: delete once getlatestruntime is implemented on API
      const runtime: Runtime = unusedRuntimes.length ?
        unusedRuntimes[0] :
        await (async () => {
          console.log("No unused runtimes to start an agent, getting a random runtime")
          const runtimes: Runtime[] = (
            await getRuntimes(false)
            .then(list => list.length ? list : Promise.all([createRuntime()]))
          )
          return runtimes[Math.floor(Math.random() * runtimes.length)]
        })()

      startAgent(agent.id, runtime.id)
      toast({
        title: "Agent Created!",
        description: "Agent has been defined, but is still waiting to start up.",
      })

      // TODO: configurable maxTries
      // TODO: configurable delay (in ms)
      const delay = 30000
      const maxTries = 15
      const arr = [...Array(maxTries).keys()]
      startLoop: for (const i of arr) {
        console.log(
          "Waiting for agent", agent.id,
          "to start up for runtime", runtime.id,
          "at", runtime.url,
        )

        const status = await getAgentStartTaskStatus(
          agent.id,
          runtime.id,
          delay,
        )
        switch (status) {
          case TaskStatus.SUCCESS:
            console.log(
              "Agent", agent.id,
              "successfully started on", runtime.id,
            "at", runtime.url,
          )
            toast({
              title: "Success!",
              description: "Agent defined and started! You can now fully interact with it.",
            })
            break startLoop;
          case TaskStatus.FAILURE:
            throw new Error("Agent Start Task Status failed!!!")
          case TaskStatus.PENDING:
          case TaskStatus.STARTED:
            toast({
              title: "Still waiting for agent to start..."
            })
        }

        if (i === maxTries - 1)
          throw new Error(`Agent Start Task Status timed out after ${maxTries} tries!!!`)
      }
    } catch (error) {
      toast({
        title: "Something went wrong. Please try again",
      });
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Accordion type="multiple" className="space-y-2">
          <AccordionItem value="Name" className={accordionItemStyle}>
            <AccordionTrigger className="font-semibold text-d6">Name</AccordionTrigger>
            <AccordionContent>
              <FormField
                name="name"
                render={({field}) => (
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

          <AccordionItem value="Message Examples" className={accordionItemStyle}>
            <AccordionTrigger className="font-semibold text-d6">
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

          <AccordionItem value="Twitter" className={accordionItemStyle}>
            <AccordionTrigger className="font-semibold text-d6">Twitter</AccordionTrigger>
            <AccordionContent>
              <FormField
                name="twitter"
                render={({field}) => (
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
  control: Control<CreateType>,
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

function Style({ control }: { control: Control<CreateType> }) {
  const getFullName = (name: string) => `style.${name}`
  function StyleHelper({name, title}: {name: string, title: string}) {
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
    <AccordionItem value="Style" className={accordionItemStyle}>
      <AccordionTrigger className="font-semibold text-d6">Style</AccordionTrigger>
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
  control: Control<CreateType>,
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    // @ts-expect-error TS not recognizing other property types
    name, // TODO: figure out why name has weird type
  })

  return (
    <AccordionItem value={title} className={accordionItemStyle}>
      <AccordionTrigger className="font-semibold text-d6">{title}</AccordionTrigger>
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
  fields: FieldArrayWithId<CreateType>[],
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
    <AccordionItem value="Environment Variables" className={accordionItemStyle}>
      <AccordionTrigger className="font-semibold text-d6">
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

function UploadForm() {
  const { user } = useDynamicContext()
  if (!user)
    throw new Error(`User ${user} does not exist!`)
  if (!user.userId)
    throw new Error(`User ${user} has no userId!`)

  const form = useForm<UploadType>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { env: "", },
  })
  const { handleSubmit } = form

  // TODO: set up sei and eth addresses if undefined

  async function onSubmit(formData: UploadType) {
    try {
      const characterFile = await formData.characterFile.text()
      const characterJson = JSON.parse(characterFile) // TODO: catch SyntaxError
      console.debug(characterJson)

      const env = formData.env
      console.debug(".env", env)

      const apiUser = await getUser({
        // TS not able to use user assertion from outside of function
        dynamicId: (user as UserProfile).userId as string
      })

      const agentPayload = {
        ownerId: apiUser.id,
        characterJson: characterJson,
        envFile: env,
      }

      const agent = await createAgent(agentPayload)
      const unusedRuntimes = await getRuntimes()
      // if no unused runtime, get a random one
      // TODO: delete once getlatestruntime is implemented on API
      const runtime: Runtime = unusedRuntimes.length ?
        unusedRuntimes[0] :
        await (async () => {
          console.log("No unused runtimes to start an agent, getting a random runtime")
          const runtimes: Runtime[] = (
            await getRuntimes(false)
            .then(list => list.length ? list : Promise.all([createRuntime()]))
          )
          return runtimes[Math.floor(Math.random() * runtimes.length)]
        })()

      startAgent(agent.id, runtime.id)
      toast({
        title: "Agent Created!",
        description: "Agent has been defined, but is still waiting to start up.",
      })

      // TODO: configurable maxTries
      // TODO: configurable delay (in ms)
      const delay = 30000
      const maxTries = 15
      const arr = [...Array(maxTries).keys()]
      startLoop: for (const i of arr) {
        console.log(
          "Waiting for agent", agent.id,
          "to start up for runtime", runtime.id,
          "at", runtime.url,
        )

        const status = await getAgentStartTaskStatus(
          agent.id,
          runtime.id,
          delay,
        )
        switch (status) {
          case TaskStatus.SUCCESS:
            console.log(
              "Agent", agent.id,
              "successfully started on", runtime.id,
            "at", runtime.url,
          )
            toast({
              title: "Success!",
              description: "Agent defined and started! You can now fully interact with it.",
            })
            break startLoop;
          case TaskStatus.FAILURE:
            throw new Error("Agent Start Task Status failed!!!")
          case TaskStatus.PENDING:
          case TaskStatus.STARTED:
            toast({
              title: "Still waiting for agent to start..."
            })
        }

        if (i === maxTries - 1)
          throw new Error(`Agent Start Task Status timed out after ${maxTries} tries!!!`)
      }
    } catch (error) {
      toast({
        title: "Something went wrong. Please try again",
      });
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Accordion type="multiple" className="space-y-2">
          <AccordionItem value="file" className={accordionItemStyle}>
            <AccordionTrigger className="font-semibold text-d6">
              Character JSON File
            </AccordionTrigger>
            <AccordionContent>
              <FormField
                name="characterFile"
                render={({ field: { onChange, onBlur, disabled, name, ref } }) => (
                  <FormItem>
                    <FormLabel></FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".json,application/json"
                        onChange={ event =>
                          onChange(event.target.files && event.target.files[0])
                        }
                        {...{ onBlur, disabled, name, ref }}
                      />
                    </FormControl>
                    <FormDescription>
                      Upload a character JSON file.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>

          <EnvironmentVariables />
        </Accordion>
        <SubmitButton />
      </form>
    </Form>
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

export {
  CreateForm,
  UploadForm,
}