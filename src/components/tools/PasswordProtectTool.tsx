import { useState } from 'react';
import { FileDropzone } from '@/components/common/FileDropzone';
import { FileList } from '@/components/common/FileList';
import { JobProgress } from '@/components/common/JobProgress';
import { AnimatedSwitch } from '@/components/ui/animated';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useJob } from '@/hooks/useJob';
import { ToolDefinition, ToolOptions } from '@/types';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface PasswordProtectToolProps {
  tool: ToolDefinition;
}

export const PasswordProtectTool = ({ tool }: PasswordProtectToolProps) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [allowPrint, setAllowPrint] = useState(true);
  const [allowCopy, setAllowCopy] = useState(false);
  const [allowEdit, setAllowEdit] = useState(false);

  const {
    files,
    addFiles,
    removeFile,
    clearFiles,
    isUploading,
    canProceed,
    pauseUpload,
    resumeUpload,
    retryUpload: retryFileUpload,
  } = useFileUpload({ tool });

  const { job, createJob, cancelJob, retryJob, resetJob } = useJob();

  const handleStartOver = () => {
    resetJob();
    clearFiles();
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setAllowPrint(true);
    setAllowCopy(false);
    setAllowEdit(false);
  };

  const handleFilesSelected = (selectedFiles: File[]) => {
    addFiles(selectedFiles);
  };

  const passwordsMatch = password === confirmPassword;
  const passwordValid = password.length >= 4;

  const handleProcess = () => {
    if (files.length === 0 || !passwordValid || !passwordsMatch) return;

    const uploadIds = files
      .map((file) => file.serverFileId)
      .filter((id): id is string => Boolean(id));

    if (uploadIds.length !== files.length) return;

    createJob(tool.id, uploadIds, {
      password,
      confirmPassword,
      permissions: { allowPrint, allowCopy, allowEdit },
    } as ToolOptions);
  };

  const handleDownload = () => {
    if (job?.result?.downloadUrl) {
      window.open(job.result.downloadUrl, '_blank');
    }
  };

  const hasFiles = files.length > 0;
  const isProcessing = job?.state === 'processing' || job?.state === 'queued';
  const viewKey = job ? 'progress' : 'upload';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <AnimatedSwitch switchKey={viewKey}>
        {job ? (
          <JobProgress
            job={job}
            onCancel={cancelJob}
            onRetry={retryJob}
            onDownload={handleDownload}
            onReset={handleStartOver}
          />
        ) : (
          <>
            <FileDropzone
              tool={tool}
              onFilesSelected={handleFilesSelected}
              disabled={isUploading}
            />

            {hasFiles && (
              <>
                <FileList
                  files={files}
                  onRemove={removeFile}
                  onRetry={retryFileUpload}
                  onPause={pauseUpload}
                  onResume={resumeUpload}
                />

                <div className="flex justify-end mb-4">
                  <Button variant="outline" onClick={clearFiles} size="sm">
                    Clear All
                  </Button>
                </div>

                <div className="rounded-xl border bg-card p-6 space-y-6">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Password Protection
                  </h3>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter password..."
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {password && !passwordValid && (
                        <p className="text-xs text-destructive">
                          Password must be at least 4 characters
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password..."
                      />
                      {confirmPassword && !passwordsMatch && (
                        <p className="text-xs text-destructive">
                          Passwords do not match
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border p-4 space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Document Permissions
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Choose what actions are allowed when the PDF is opened
                      with the password.
                    </p>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="allow-print">Allow Printing</Label>
                          <p className="text-xs text-muted-foreground">
                            Users can print the document
                          </p>
                        </div>
                        <Switch
                          id="allow-print"
                          checked={allowPrint}
                          onCheckedChange={setAllowPrint}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="allow-copy">Allow Copying</Label>
                          <p className="text-xs text-muted-foreground">
                            Users can copy text and images
                          </p>
                        </div>
                        <Switch
                          id="allow-copy"
                          checked={allowCopy}
                          onCheckedChange={setAllowCopy}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="allow-edit">Allow Editing</Label>
                          <p className="text-xs text-muted-foreground">
                            Users can modify the document
                          </p>
                        </div>
                        <Switch
                          id="allow-edit"
                          checked={allowEdit}
                          onCheckedChange={setAllowEdit}
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleProcess}
                    disabled={
                      !hasFiles ||
                      isProcessing ||
                      !passwordValid ||
                      !passwordsMatch ||
                      !canProceed
                    }
                    className="w-full bg-gradient-primary"
                    size="lg"
                  >
                    <Lock className="w-5 h-5 mr-2" />
                    Protect PDF
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </AnimatedSwitch>
    </div>
  );
};
