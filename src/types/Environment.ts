
export type Options = {
    [key: string]: string | undefined;
}

export type EnvironmentInput = {
    name: string;
    image: string;
    command?: string;
    comfyui_path?: string;
    options?: Options;
}

export type Environment = {
    name: string;
    image: string;
    id?: string;
    status?: string;
    command?: string;
    comfyui_path?: string;
    options?: Options;
    metadata?: Options;
}

// name: str
// image: str
// id: str = ""
// status: str = ""
// command: str = ""
// comfyui_path: str = ""
// options: dict = {}
// metadata: dict = {}
