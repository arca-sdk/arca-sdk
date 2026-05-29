export interface ArcaErrorOptions {
  cause?: unknown;
  endpoint?: string;
  operation?: string;
}

export class ArcaSdkError extends Error {
  readonly endpoint?: string;
  readonly operation?: string;

  constructor(message: string, options: ArcaErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = new.target.name;

    if (options.endpoint !== undefined) {
      this.endpoint = options.endpoint;
    }

    if (options.operation !== undefined) {
      this.operation = options.operation;
    }
  }
}

export class ArcaAuthError extends ArcaSdkError {}

export class ArcaSoapError extends ArcaSdkError {}

export class ArcaSoapMethodNotFoundError extends ArcaSoapError {}

export class ArcaUnexpectedResponseError extends ArcaSoapError {}

export class ArcaConfigurationError extends ArcaSdkError {}
