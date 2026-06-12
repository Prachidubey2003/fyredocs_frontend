import { UseFormReturn } from 'react-hook-form';
import { FileUpload, ToolDefinition } from '@/types';

/** Form values are intentionally loose — each panel's Zod schema enforces its own shape. */
export type OptionsFormValues = Record<string, unknown>;

/**
 * Shared contract for every composable options panel rendered inside the
 * workbench's configure stage. Panels are presentational + RHF field wiring.
 */
export interface OptionsPanelProps {
  tool: ToolDefinition;
  form: UseFormReturn<OptionsFormValues>;
  files: FileUpload[];
  pageCount: number | null;
}
