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

const borderStyle = "rounded-xl border border-black dark:border-white"
const accordionItemStyle = "data-[state=open]:bg-anakiwa-lighter/70 data-[state=open]:dark:bg-anakiwa-darker/70 rounded-xl px-4"

const MAX_FILE_SIZE = 5000000;
const fileSchema = z.object({
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
  env: z.string(),
})

const stringListTitles = {
  "bio": "Biography",
  "lore": "Lore",
  "postExamples": "Post Examples",
  "adjectives": "Adjectives",
  "topics": "Topics",
 }
const stringListSchema = z.object({
  bio: z.string().array().min(1),
  lore: z.string().array().min(1),
  postExamples: z.string().array().min(1),
  adjectives: z.string().array().min(1),
  topics: z.string().array().min(1),
})

const messageExampleTitles = {
  "user": "User",
  "content.text": "Text",
  "context.action": "Action (Optional)",
}
const knowledgeTitles = {
  "id": "ID",
  "path": "Path",
  "content": "Content",
}
const styleTitles = {
  "all": "All",
  "chat": "Chat",
  "post": "Post",
}
const characterSchema = z.object({
  name: z.string(),
  messageExamples: z.object({
    user: z.string(),
    content: z.object({
      text: z.string(),
      action: z.string().optional(),
    })
  }).array().min(1).array().min(1),
  knowledge: z.object({
    id: z.string(),
    path: z.string(),
    content: z.string(),
  }).array().optional(),
  style: z.object({
    all: z.string().array().min(1),
    chat: z.string().array().min(1),
    post: z.string().array().min(1),
  }),
}).merge(stringListSchema)

const formSchema = characterSchema.merge(fileSchema)
type FormType = z.infer<typeof formSchema>

export default function CreationForm() {
  const { user } = useDynamicContext()
  if (!user)
    throw new Error(`User ${user} does not exist!`)
  if (!user.userId)
    throw new Error(`User ${user} has no userId!`)

  const form = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      env: "",
      name: "",
      bio: [""],
      lore: [""],
      messageExamples: [[{
        user: "",
        content: {
          text: "",
          action: "",
        },
      }]],
      postExamples: [""],
      adjectives: [""],
      topics: [""],
      knowledge: [{
        id: "",
        path: "",
        content: "",
      }],
      style: { all: [""], chat: [""], post: [""], }
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

  async function onSubmit(formData: z.infer<typeof formSchema>) {
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
          <AccordionItem value="Name" className={accordionItemStyle}>
            <AccordionTrigger className="font-semibold text-d6">Name</AccordionTrigger>
            <AccordionContent>
              <FormField
                name="name"
                render={({field}) => (
                  <FormItem>
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

          <Knowledge control={control} />
          <Style control={control} />

        </Accordion>

        <FormField
          name="characterFile"
          render={({ field: { onChange, onBlur, disabled, name, ref } }) => (
            <FormItem>
              <FormLabel>Character JSON</FormLabel>
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
                Upload a character JSON file. This while disable all other fields but .env.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="env"
          render={({ field }) => (
            <FormItem>
              <FormLabel>.env</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription />
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
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

function Knowledge({ control }: { control: Control<FormType> }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "knowledge",
  })

  return (
    <AccordionItem value="Knowledge" className={accordionItemStyle}>
      <AccordionTrigger className="font-semibold text-d6">Knowledge</AccordionTrigger>
      <AccordionContent className="space-y-8">
        <div className="space-y-4">
        {fields.map((formField, index) => (
          <div key={formField.id} className={cn(borderStyle, "space-y-8 p-4")}>
            <div>
            {Object.entries(knowledgeTitles).map(([name, title]) => (
              <FormField
                key={`knowledge.${index}.${name}`}
                name={`knowledge.${index}.${name}`}
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
            <Button type="button" variant="destructive" onClick={() => remove(index)}>
              Remove Knowledge
            </Button>
          </div>
        ))}
        </div>
        <Button type="button" onClick={() => append({id: "", path: "", content: ""})}>
          Add Knowledge
        </Button>
      </AccordionContent>
    </AccordionItem>
  )
}

function Style({ control }: { control: Control<FormType> }) {
  const arrays = Object.entries(styleTitles)
    .map(([name, title]) => {
      const fullName = `style.${name}`
      const { fields, append, remove } = useFieldArray({
      // @ts-expect-error TS not recognizing other property types
        control, name: fullName,
      })
      return { name: fullName, title, fields, append, remove }
    })

  return (
    <AccordionItem value="Style" className={accordionItemStyle}>
      <AccordionTrigger className="font-semibold text-d6">Style</AccordionTrigger>
      <AccordionContent className="space-y-4">
      {arrays.map(({ name, title, append, ...props }) => (
        <div key={name} className={cn(borderStyle, "space-y-8 p-4")}>
          <h3 className="font-semibold">{title}</h3>
          <FieldArray name={name} title={title} {...props} />
          {/* @ts-expect-error TS not recognizing other property types */}
          <Button type="button" onClick={() => append([" "])}>Add {title}</Button>
          {/* TODO: figure out why empty string yields unexpected behavior */}
        </div>
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