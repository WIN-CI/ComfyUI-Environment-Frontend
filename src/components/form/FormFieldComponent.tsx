import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface FormFieldComponentProps {
  control: any;
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  children?: React.ReactNode;
}

const FormFieldComponent = ({
  control,
  name,
  label,
  placeholder,
  type = "text",
  children,
}: FormFieldComponentProps) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem className="grid grid-cols-4 items-center gap-4">
        <FormLabel className="text-right">{label}</FormLabel>
        <FormControl className="col-span-3">
          {children || <Input {...field} type={type} placeholder={placeholder} />}
        </FormControl>
        <FormMessage className="col-start-2 col-span-3" />
      </FormItem>
    )}
  />
);

export default FormFieldComponent;
