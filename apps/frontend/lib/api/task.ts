interface AgentStartTask {
  agentId: string
  runtimeId: string
  celeryTaskId: string
}

interface RuntimeCreateTask {
  runtimeId: string
  celeryTaskId: string
}

interface RuntimeUpdateTask {
  runtimeId: string
  celeryTaskId: string
}

enum TaskStatus {
  FAILURE = "FAILURE",
  PENDING = "PENDING",
  STARTED = "STARTED",
  SUCCESS = "SUCCESS",
}

export {
  TaskStatus,
}

export type {
  AgentStartTask,
  RuntimeCreateTask,
  RuntimeUpdateTask,
}