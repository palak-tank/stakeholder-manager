export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

function messageForStatus(status: number): string {
  switch (status) {
    case 400: return 'Bad request. Please check your input.';
    case 403: return "You don't have permission to access this resource.";
    case 404: return 'The requested resource could not be found.';
    case 409: return 'A conflict occurred. The resource may already exist.';
    case 422: return 'The data provided is invalid.';
    case 500: return 'Something went wrong on our end. Please try again later.';
    case 503: return 'The service is temporarily unavailable. Please try again later.';
    default:  return `An unexpected error occurred (HTTP ${status}).`;
  }
}

export async function handleResponse(response: Response): Promise<void> {
  if (response.status === 401) {
    window.location.href = '/login';
    throw new ApiError(401, 'Your session has expired. Please log in again.');
  }

  if (!response.ok) {
    let message = messageForStatus(response.status);
    try {
      const body = await response.json();
      if (typeof body?.message === 'string') message = body.message;
    } catch {
      // body not JSON — use default status message
    }
    throw new ApiError(response.status, message);
  }
}
