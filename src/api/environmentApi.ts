// src/api/environmentApi.ts
import { UserSettingsInput } from '@/types/UserSettings';
import { Environment, EnvironmentInput, EnvironmentUpdate } from '../types/Environment';

const API_BASE_URL = 'http://localhost:5172'; // TODO: put in .env

export async function fetchEnvironments() {
  const response = await fetch(`${API_BASE_URL}/environments`);
  if (!response.ok) {
    const errorDetails = await response.json()
    console.error(`${response.status} - Failed to fetch environments: ${errorDetails.detail}`)
    throw new Error(`${errorDetails.detail}`);
  }
  return response.json();
}

export async function createEnvironment(environment: EnvironmentInput) {
  console.log(`JSON output: ${JSON.stringify(environment)}`)
  const response = await fetch(`${API_BASE_URL}/environments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(environment),
  });
  if (!response.ok) {
    const errorDetails = await response.json()
    console.error(`${response.status} - Failed to create environment: ${errorDetails.detail}`)
    throw new Error(`${errorDetails.detail}`);
  }
  return response.json();
}

export async function activateEnvironment(id: string) {
  const response = await fetch(`${API_BASE_URL}/environments/${id}/activate`, {
    method: 'POST',
  });
  if (!response.ok) {
    const errorDetails = await response.json()
    console.error(`${response.status} - Failed to activate environment: ${errorDetails.detail}`)
    throw new Error(`${errorDetails.detail}`);
  }
  return response.json();
}

export async function deactivateEnvironment(id: string) {
  const response = await fetch(`${API_BASE_URL}/environments/${id}/deactivate`, {
    method: 'POST',
  });
  if (!response.ok) {
    const errorDetails = await response.json()
    console.error(`${response.status} - Failed to deactivate environment: ${errorDetails.detail}`)
    throw new Error(`${errorDetails.detail}`);
  }
  return response.json();
}

export async function deleteEnvironment(id: string) {
  const response = await fetch(`${API_BASE_URL}/environments/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorDetails = await response.json()
    console.error(`${response.status} - Failed to delete environment: ${errorDetails.detail}`)
    throw new Error(`${errorDetails.detail}`);
  }
  return response.json();
}

export async function duplicateEnvironment(id: string, environment: Environment) {
  const response = await fetch(`${API_BASE_URL}/environments/${id}/duplicate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(environment),
  });
  if (!response.ok) {
    const errorDetails = await response.json()
    console.error(`${response.status} - Failed to duplicate environment: ${errorDetails.detail}`)
    throw new Error(`${errorDetails.detail}`);
  }
  return response.json();
}

export async function updateEnvironment(id: string, environment: EnvironmentUpdate) {
  const response = await fetch(`${API_BASE_URL}/environments/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(environment),
  });
  if (!response.ok) {
    const errorDetails = await response.json()
    console.error(`${response.status} - Failed to update environment: ${errorDetails.detail}`)
    throw new Error(`${errorDetails.detail}`);
  }
  return response.json();
}

export function connectToLogStream(environmentId: string, onLogReceived: (log: string) => void) {
  const eventSource = new EventSource(`${API_BASE_URL}/environments/${environmentId}/logs`);

  eventSource.onmessage = (event) => {
    onLogReceived(event.data);
  };

  eventSource.onerror = (error) => {
    console.error("Error receiving log stream:", error);
    eventSource.close();
  };

  return () => {
    eventSource.close();
  };
}

export async function tryInstallComfyUI(comfyUIPath: string, branch: string = "master") {
  const response = await fetch(`${API_BASE_URL}/install-comfyui`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path: comfyUIPath, branch: branch }),
  });
  console.log(response)
  if (!response.ok) {
    const errorDetails = await response.json()
    console.error(`${response.status} - Failed to install ComfyUI: ${errorDetails.detail}`)
    throw new Error(`${errorDetails.detail}`);
  }
  return response.json();
}

export async function getUserSettings() {
  const response = await fetch(`${API_BASE_URL}/user-settings`);
  if (!response.ok) {
    const errorDetails = await response.json()
    console.error(`${response.status} - Failed to get user settings: ${errorDetails.detail}`)
    throw new Error(`${errorDetails.detail}`);
  }
  return response.json();
}

export async function updateUserSettings(settings: UserSettingsInput) {
  const response = await fetch(`${API_BASE_URL}/user-settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });
  if (!response.ok) {
    const errorDetails = await response.json()
    console.error(`${response.status} - Failed to update user settings: ${errorDetails.detail}`)
    throw new Error(`${errorDetails.detail}`);
  }
  return response.json();
}

// Add more functions for other API actions like update, delete, etc.