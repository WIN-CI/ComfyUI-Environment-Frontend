export type Options = {
    [key: string]: string | Options | undefined ;
}

export type EnvironmentInput = {
    name: string;
    image: string;
    command?: string;
    comfyui_path?: string;
    options?: Options;
    folderIds?: string[];
}

export type Environment = {
    name: string;
    image: string;
    container_name?: string;
    id?: string;
    status?: string;
    command?: string;
    duplicate?: boolean;
    comfyui_path?: string;
    options?: Options;
    metadata?: Options;
    folderIds?: string[];
}

export type EnvironmentUpdate = {
    name?: string;
    options?: Options;
    folderIds?: string[];
}

// name: str
// image: str
// id: str = ""
// status: str = ""
// command: str = ""
// comfyui_path: str = ""
// options: dict = {}
// metadata: dict = {}
