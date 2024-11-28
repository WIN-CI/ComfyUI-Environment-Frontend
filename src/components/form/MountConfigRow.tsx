import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import {
  FormField,
  FormControl,
  FormItem,
} from "@/components/ui/form";

interface MountConfigRowProps {
  index: number;
  remove: (index: number) => void;
  control: any;
  onActionChange: () => void;
}

const MountConfigRow = ({ index, remove, control, onActionChange }: MountConfigRowProps) => (
  <div className="flex items-center space-x-2 mb-2">
    <div className="w-full">
      <FormField
        control={control}
        name={`mountConfig.${index}.directory`}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input
                {...field}
                placeholder="Directory name"
                onChange={(e) => {
                  field.onChange(e);
                  onActionChange();
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
    <div className="w-40">
      <FormField
        control={control}
        name={`mountConfig.${index}.action`}
        render={({ field }) => (
          <FormItem>
            <Select
              onValueChange={(value) => {
                field.onChange(value);
                onActionChange();
              }}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="mount">Mount</SelectItem>
                <SelectItem value="copy">Copy</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />
    </div>
    <Button
      type="button"
      variant="ghost"
      onClick={() => {
        remove(index);
        onActionChange();
      }}
    >
      <X className="h-4 w-4" />
    </Button>
  </div>
);

export default MountConfigRow;
