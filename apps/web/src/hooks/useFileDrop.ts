import { useCallback, useState, type DragEvent } from 'react'

/**
 * Drag-and-drop file handling shared by the batch import area, the logo dropzone, and
 * the scanner's image dropzone: preventDefault + drag-state toggling + dispatching the
 * first dropped file. The dragleave check ignores events fired when the pointer crosses
 * into the dropzone's own children, so the highlight doesn't flicker while dragging over
 * nested elements.
 */
export function useFileDrop<T extends Element = Element>(
  onFile: (file: File) => void,
  options?: { disabled?: boolean },
) {
  const [isDragging, setIsDragging] = useState(false)
  const disabled = options?.disabled ?? false

  const onDragOver = useCallback((e: DragEvent<T>) => {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }, [disabled])

  const onDragLeave = useCallback((e: DragEvent<T>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
    setIsDragging(false)
  }, [])

  const onDrop = useCallback((e: DragEvent<T>) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return
    const file = e.dataTransfer.files?.[0]
    if (file) onFile(file)
  }, [disabled, onFile])

  return { isDragging, onDragEnter: onDragOver, onDragOver, onDragLeave, onDrop }
}
