import { camelize } from "@/lib/utils"

interface BaseErrorResult {
  status: "error"
  message: string
}

interface BadRequestError extends BaseErrorResult {
  code: 400
}

interface UnauthorizedError extends BaseErrorResult {
  code: 401
}

interface ForbiddenError extends BaseErrorResult {
  code: 403
}

interface NotFoundError extends BaseErrorResult {
  code: 404
}

interface InternalServerError extends BaseErrorResult {
  code: 500
}

type ErrorResult = 
  | BadRequestError
  | UnauthorizedError
  | ForbiddenError
  | NotFoundError
  | InternalServerError

function createBaseError(message: string): BaseErrorResult {
  return { status: "error", message }
}

function createBadRequestError(
  { url, text }: { url: string, text: string }
): BadRequestError {
  return {
    code: 400,
    ...createBaseError(`Made a bad request to ${url}! Got ${text}`),
  }
}

function isBadRequest<T>(result: Result<T>): result is BadRequestError {
  return result.status === "error" && result.code === 400
}

function createUnauthorizedError(
  { url, text }: { url: string, text: string }
): UnauthorizedError {
  return {
    code: 401,
    ...createBaseError(`Resource at ${url} unauthorized! Got ${text}`),
  }
}

function createForbiddenError(
  { url, text }: { url: string, text: string }
): ForbiddenError {
  return {
    code: 403,
    ...createBaseError(`Resource at ${url} forbidden! Got ${text}`),
  }
}

function createNotFoundError(
  { url, text }: { url: string, text: string }
): NotFoundError {
  return {
    code: 404,
    ...createBaseError(`Resource at ${url} not found! Got ${text}`),
  }
}

function isNotFound<T>(result: Result<T>): result is NotFoundError {
  return result.status === "error" && result.code === 404
}

function createInternalServerError(
  message: string
): InternalServerError {
  return {
    code: 500,
    ...createBaseError(message)
  }
}

interface SuccessResult<T> {
  status: "success"
  data: T
}

function createSuccessResult<T> (data: T): SuccessResult<T> {
  return {
    status: "success",
    data,
  }
}

type Result<T> = SuccessResult<T> | ErrorResult

function isSuccessResult<T>(result: Result<T>): result is SuccessResult<T> {
  return result.status === "success"
}

function isErrorResult<T>(result: Result<T>): result is ErrorResult {
  return result.status === "error"
}

async function createResult<T>(
  response: Response,
  errorMessage: string,
  camelizeResponse: boolean = true,
): Promise<Result<T>> {
  const { status, url, ok } = response

  if (ok) { return {
    data: (
      ( camelizeResponse )
      ? camelize(await response.json() as Record<string, unknown>)
      : await response.json()
    ),
    status: "success",
  }}

  switch (status) {
    case 400:
      return createBadRequestError({url, text: (await response.text())})
    case 401:
      return createForbiddenError({url, text: (await response.text())})
    case 403:
      return createUnauthorizedError({url, text: (await response.text())})
    case 404:
      return createNotFoundError({url, text: (await response.text())})
    case 500:
      return createInternalServerError(await response.text())
  }

  throw new Error(errorMessage)
}

export {
  createInternalServerError,
  createResult,
  createSuccessResult,
  isBadRequest,
  isErrorResult,
  isNotFound,
  isSuccessResult,
}

export type {
  Result,
}