import { PlatePartyError } from "../errors/PlatePartyError";

export class UnauthorizedError extends PlatePartyError {
  constructor(message = "Please sign in to continue.") {
    super("UNAUTHORIZED", message);
  }
}

export class ValidationError extends PlatePartyError {
  constructor(message = "Please check your input and try again.") {
    super("VALIDATION_ERROR", message);
  }
}

export class FinancialOperationError extends PlatePartyError {
  constructor(message = "This plate transaction could not be completed.") {
    super("FINANCIAL_OPERATION_FAILED", message);
  }
}

export { PlatePartyError };
