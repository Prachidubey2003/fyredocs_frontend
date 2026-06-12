import { FileUpload, ToolDefinition, ToolOptions } from '@/types';

/**
 * Contract for bespoke configure-stage bodies (sign-pdf, edit-pdf).
 *
 * The workbench owns upload + job lifecycle; the bespoke component owns its
 * tool-specific options UI AND the primary CTA (its enablement depends on
 * internal state like "has a signature been drawn"). Submitting delegates
 * back to the workbench via `onSubmit(options)`, which validates uploads and
 * calls `createJob(tool.id, serverFileIds, options)`.
 */
export interface BespokeConfigureProps {
  tool: ToolDefinition;
  files: FileUpload[];
  /** True when every file is uploaded (serverFileId present) and a job may be created. */
  canSubmit: boolean;
  /** Create the job with the bespoke options payload. */
  onSubmit: (options: ToolOptions) => void;
}
