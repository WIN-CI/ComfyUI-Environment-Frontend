import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Folder, FolderInput } from '@/types/UserSettings'
import { FolderIcon } from 'lucide-react'

interface CreateFolderDialogProps {
  onConfirm: (folder: FolderInput) => void
  children: React.ReactNode
}

export function CreateFolderDialog({ onConfirm, children }: CreateFolderDialogProps) {
  const [folderName, setFolderName] = useState('')
  const [open, setOpen] = useState(false)

  const handleConfirm = () => {
    if (folderName.trim()) {
      const newFolder: FolderInput = { name: folderName.trim(), icon: 'FolderIcon' }
      onConfirm(newFolder)
      setFolderName('')
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogDescription>
            Enter a name for your new folder. Click confirm when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="folderName" className="text-right">
              Name
            </Label>
            <Input
              id="folderName"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault(); // Prevent form submission if inside a form
                  handleConfirm();
                }
              }}
              className="col-span-3"
              autoComplete="off"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
