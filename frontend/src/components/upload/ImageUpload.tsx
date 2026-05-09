import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../api/axios'

interface Props {
  currentImage?: string | null
  onUpload: (url: string) => void
}

export default function ImageUpload({ currentImage, onUpload }: Props) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ chấp nhận file ảnh!')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh tối đa 5MB!')
      return
    }

    // Preview ngay lập tức
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onUpload(res.data.url)
      toast.success('Upload ảnh thành công!')
    } catch {
      toast.error('Lỗi upload ảnh!')
      setPreview(currentImage || null)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-2">
      <div
        className={`relative border-2 border-dashed rounded-xl overflow-hidden transition-colors cursor-pointer ${
          uploading ? 'border-orange-300 bg-orange-50' : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50'
        }`}
        style={{ height: 160 }}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {preview ? (
          <img src={preview} alt="preview" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <span className="text-3xl mb-2">🖼️</span>
            <p className="text-sm font-medium">Click hoặc kéo ảnh vào đây</p>
            <p className="text-xs mt-1">PNG, JPG tối đa 5MB</p>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-orange-600 font-medium">Đang upload...</p>
            </div>
          </div>
        )}
      </div>

      {preview && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setPreview(null)
            onUpload('')
          }}
          className="text-xs text-red-400 hover:text-red-600"
        >
          × Xoá ảnh
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
    </div>
  )
}
