import { useState } from "react";
import { 
  Button 
} from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import {
  Fan,
  Settings,
  Copy,
  Trash2,
  Play,
  SquareTerminal,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { 
  Environment, 
  EnvironmentInput 
} from "@/types/Environment";
import SettingsEnvironmentDialog from "./dialogs/SettingsEnvironmentDialog";
import LogDisplayDialog from "./dialogs/LogDisplayDialog";
import DuplicateEnvironmentDialog from "./dialogs/DuplicateEnvironmentDialog";
import { CustomAlertDialog } from "./dialogs/CustomAlertDialog";
import { StatusBadge } from "./utils/StatusBadge";
import { ToolTip } from "./utils/Tooltip";

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
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [logDisplayDialogOpen, setLogDisplayDialogOpen] = useState(false);
  const [duplicateEnvironmentDialogOpen, setDuplicateEnvironmentDialogOpen] = useState(false);
  const [deleteEnvironmentDialogOpen, setDeleteEnvironmentDialogOpen] = useState(false);

  const isDeleting = deletingEnvironment === environment.id;
  const isRunning = environment.status === "running";
  const isActivating = activatingEnvironment === environment.id;
  const port = environment.options?.["port"] as number | undefined;
  const baseImage = environment.metadata?.["base_image"] as string;
  const environmentId = environment.id || "";

  const handleActivateDeactivate = () => {
    if (isRunning) {
      return deactivateEnvironmentHandler(environmentId);
    }
    return activateEnvironmentHandler(environmentId);
  };

  return (
    <Card
      key={environment.id}
      className={`relative ${isRunning ? "ring-2 ring-slate-500" : ""}`}
    >
      <div className="relative">
        {isDeleting && (
          <div className="absolute top-0 left-0 w-full h-full bg-zinc-200/50 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-zinc-900 dark:text-zinc-50 animate-spin mr-2" />
            Deleting...
          </div>
        )}

        {/* Top Right Status & Link */}
        <div className="absolute top-2 right-2 flex items-center space-x-4">
          {isRunning && port && (
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

        {isRunning && (
          <div className="absolute top-[50px] right-[28px] animate-spin">
            <Fan className="w-6 h-6 text-zinc-900 dark:text-zinc-50" />
          </div>
        )}

        {/* Card Content */}
        <CardContent className="pt-6">
          <div className="text-4xl mb-2">🖥️</div>
          <h3 className="text-lg font-semibold">{environment.name}</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{baseImage}</p>
        </CardContent>

        {/* Card Footer (Actions) */}
        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            <SettingsEnvironmentDialog
              environment={environment}
              updateEnvironmentHandler={updateEnvironmentHandler}
              open={settingsDialogOpen}
              onOpenChange={setSettingsDialogOpen}
            />
            <ToolTip content="Settings">
              <Button variant="ghost" size="icon" onClick={() => setSettingsDialogOpen(true)}>
                <Settings className="w-4 h-4" />
              </Button>
            </ToolTip>

            <LogDisplayDialog
              environment={environment}
              open={logDisplayDialogOpen}
              onOpenChange={setLogDisplayDialogOpen}
            />
            <ToolTip content="Log Display">
              <Button variant="ghost" size="icon" onClick={() => setLogDisplayDialogOpen(true)}>
                <SquareTerminal className="w-4 h-4" />
              </Button>
            </ToolTip>

            <DuplicateEnvironmentDialog
              environment={environment}
              environments={environments}
              duplicateEnvironmentHandler={duplicateEnvironmentHandler}
              open={duplicateEnvironmentDialogOpen}
              onOpenChange={setDuplicateEnvironmentDialogOpen}
            />
            <ToolTip content="Duplicate">
              <Button variant="ghost" size="icon" onClick={() => setDuplicateEnvironmentDialogOpen(true)}>
                <Copy className="w-4 h-4" />
              </Button>
            </ToolTip>

            <CustomAlertDialog
              title={`Delete ${environment.name} ?`}
              description="This action cannot be undone. This will permanently delete your environment."
              cancelText="Cancel"
              actionText="Delete"
              onCancel={() => {}}
              onAction={() => deleteEnvironmentHandler(environmentId)}
              open={deleteEnvironmentDialogOpen}
              onOpenChange={setDeleteEnvironmentDialogOpen}
            />
            <ToolTip content="Delete">
              <Button variant="ghost" size="icon" onClick={() => setDeleteEnvironmentDialogOpen(true)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </ToolTip>
          </div>

          {/* Activate/Deactivate Button */}
          <Button disabled={isActivating} onClick={handleActivateDeactivate}>
            {isActivating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {isRunning ? "Deactivate" : "Activate"}
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}
