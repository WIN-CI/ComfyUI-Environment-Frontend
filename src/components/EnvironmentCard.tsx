import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Fan, Settings, Copy, Trash2, Play, SquareTerminal, Loader2, ExternalLink } from 'lucide-react';
import { Environment, EnvironmentInput } from "@/types/Environment";
import { StatusBadge } from "./utils/StatusBadge";
import SettingsEnvironmentDialog from "./dialogs/SettingsEnvironmentDialog";
import LogDisplayDialog from "./dialogs/LogDisplayDialog";
import DuplicateEnvironmentDialog from "./dialogs/DuplicateEnvironmentDialog";
import { CustomAlertDialog } from "./dialogs/CustomAlertDialog";

type EnvironmentCardProps = {
  environment: Environment;
  environments: Environment[];
  activatingEnvironment: string | null;
  deletingEnvironment: string | null;
  updateEnvironmentHandler: (id: string, name: string) => Promise<void>;
  duplicateEnvironmentHandler: (id: string, environment: EnvironmentInput) => Promise<void>;
  deleteEnvironmentHandler: (id: string) => Promise<void>;
  activateEnvironmentHandler: (id: string) => Promise<void>;
  deactivateEnvironmentHandler: (id: string) => Promise<void>;
};

export default function EnvironmentCard({
  environment,
  environments,
  activatingEnvironment,
  deletingEnvironment,
  updateEnvironmentHandler,
  duplicateEnvironmentHandler,
  deleteEnvironmentHandler,
  activateEnvironmentHandler,
  deactivateEnvironmentHandler,
}: EnvironmentCardProps) {
  const port = environment.options?.["port"] as number | undefined;

  return (
    <Card
      key={environment.id}
      className={`relative ${environment.status === "running" ? "ring-2 ring-slate-500" : ""}`}
    >
      <div className="relative">
        {deletingEnvironment === environment.id && (
          <div className="absolute top-0 left-0 w-full h-full bg-zinc-200/50 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-zinc-900 dark:text-zinc-50 animate-spin mr-2" />
            Deleting...
          </div>
        )}
        <div className="absolute top-2 right-2 flex items-center space-x-4">
          {environment.status === "running" && port && (
            <a
              href={`http://localhost:${port}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              localhost:{port}
            </a>
          )}
          <StatusBadge status={environment.status || "Unknown"} className="my-2" />
        </div>
        {environment.status === "running" && (
          <div className="absolute top-[50px] right-[28px] animate-spin">
            <Fan className="w-6 h-6 text-zinc-900 dark:text-zinc-50" />
          </div>
        )}
        <CardContent className="pt-6">
          <div className="text-4xl mb-2">🖥️</div>
          <h3 className="text-lg font-semibold">{environment.name}</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {environment.metadata?.["base_image"] as string}
          </p>
          {/* <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
            {new Date(Number(environment.metadata?.["created_at"]) * 1000).toLocaleString()}
          </p> */}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            <SettingsEnvironmentDialog
              environment={environment}
              updateEnvironmentHandler={updateEnvironmentHandler}
            >
              <Button variant="ghost" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </SettingsEnvironmentDialog>
            <LogDisplayDialog environment={environment}>
              <Button variant="ghost" size="icon">
                <SquareTerminal className="w-4 h-4" />
              </Button>
            </LogDisplayDialog>
            <DuplicateEnvironmentDialog
              environment={environment}
              environments={environments}
              duplicateEnvironmentHandler={duplicateEnvironmentHandler}
            >
              <Button variant="ghost" size="icon">
                <Copy className="w-4 h-4" />
              </Button>
            </DuplicateEnvironmentDialog>
            <CustomAlertDialog
              title={`Delete ${environment.name} ?`}
              description="This action cannot be undone. This will permanently delete your environment."
              cancelText="Cancel"
              actionText="Delete"
              onAction={() => deleteEnvironmentHandler(environment.id || "")}
            >
              <Button variant="ghost" size="icon">
                <Trash2 className="w-4 h-4" />
              </Button>
            </CustomAlertDialog>
          </div>
          <Button
            disabled={activatingEnvironment === environment.id}
            onClick={() =>
              environment.status === "running"
                ? deactivateEnvironmentHandler(environment.id || "")
                : activateEnvironmentHandler(environment.id || "")
            }
          >
            {activatingEnvironment === environment.id ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {environment.status === "running" ? "Deactivate" : "Activate"}
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}

