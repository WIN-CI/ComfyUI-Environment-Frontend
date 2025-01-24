// src/api/environmentApi.ts
import { Folder, UserSettingsInput } from '@/types/UserSettings';
import { Environment, EnvironmentInput, EnvironmentUpdate } from '../types/Environment';

const API_BASE_URL = process.env.SERVER_URL;

export async function fetchEnvironments(folderId?: string) {
  const response = await fetch(`${API_BASE_URL}/environments${folderId ? `?folderId=${folderId}` : ''}`);
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

export async function checkValidComfyUIPath(comfyUIPath: string): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/valid-comfyui-path`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path: comfyUIPath }),
  });
  if (!response.ok) {
    return false;
  }
  return true;
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

export async function getComfyUIImageTags() {
  const response = await fetch(`${API_BASE_URL}/images/tags`);
  if (!response.ok) {
    const errorDetails = await response.json()
    console.error(`${response.status} - Failed to get ComfyUI image tags: ${errorDetails.detail}`)
    throw new Error(`${errorDetails.detail}`);
  }
  return response.json();
}

export async function checkImageExists(image: string) {
  const encodedImage = encodeURIComponent(image)
  const response = await fetch(`${API_BASE_URL}/images/exists?image=${encodedImage}`);
  if (!response.ok) {
    return false;
  }
  return true;
}

export function pullImageStream(image: string, onProgress: (progress: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const encodedImage = encodeURIComponent(image)
    const eventSource = new EventSource(`${API_BASE_URL}/images/pull?image=${encodedImage}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.error) {
        console.error("Error:", data.error);
        eventSource.close();
        reject(data.error);
        return;
      }

      if (data.progress !== undefined) {
        onProgress(data.progress);
      }

      if (data.status === 'completed') {
        console.log("Image pull completed.");
        eventSource.close();
        resolve();
      }
    };

    eventSource.onerror = (err) => {
      console.error("EventSource failed:", err);
      eventSource.close();
      reject(err);
    };
  });
}

export async function createFolder(name: string): Promise<Folder> {
  const response = await fetch(`${API_BASE_URL}/folders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!response.ok) {
    const errorDetails = await response.json();
    throw new Error(errorDetails.detail);
  }
  return response.json();
}

export async function updateFolder(id: string, name: string): Promise<Folder> {
  const response = await fetch(`${API_BASE_URL}/folders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!response.ok) {
    const errorDetails = await response.json();
    throw new Error(errorDetails.detail);
  }
  return response.json();
}

export async function deleteFolder(id: string): Promise<{status: string}> {
  const response = await fetch(`${API_BASE_URL}/folders/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    const errorDetails = await response.json();
    throw new Error(errorDetails.detail);
  }
  return response.json();
}

// Add more functions for other API actions like update, delete, etc.