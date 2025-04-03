interface Character {
  name: string
  clients: string[]
  modelProvider: string
  settings?: {
    secrets?: {}
  }
  plugins: string[]
  bio: string[]
  lore: string[]
  knowledge?: string[]
  messageExamples: {
    user: string
    content: {
      text: string
      action?: string
    }
  }[][]
  postExamples: string[]
  adjectives: string[]
  topics: string[]
  style: {
    all: string[]
    chat: string[]
    post: string[]
  }
}

export type {
  Character,
}