import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { File, FileText, Image } from "lucide-react";

function FileDropzone() {
const [files, setFiles] = useState<File[]>([]);

const onDrop = (acceptedFiles: File[]) => {
  setFiles((prev) => [...prev, ...acceptedFiles]);
};

const { getRootProps, getInputProps, isDragActive } = useDropzone({
  onDrop,
});

const getFileIcon = (file: File) => {
  if (file.type.startsWith("image/")) {
    return <Image className="h-20 w-20" />;
  }

  if (file.type === "application/pdf") {
    return <FileText className="h-20 w-20" />;
  }

  return <File className="h-20 w-20" />;
};

const deleteButton = (name: string) => {
  setFiles((prev) => prev.filter((file) => file.name !== name));
};

  return(
    <>
    <div className="flex-col">
    <div className={`border-2 border-dashed rounded-md p-8 cursor-pointer
  min-h-48
  max-w-[100]
  flex items-center justify-center flex-wrap
  text-center
  transition-all duration-200
  ${
    isDragActive
      ? "border-blue-500 bg-blue-50 scale-[1.02]"
      : "border-gray-400"
  }`} {...getRootProps()}>
      <input {...getInputProps()} />
      {files.length > 0 && (
        <ul className="flex justify-center text-center gap-4">
          {files.map((file, index) => (
            <li className="relative" key={index}>
              {getFileIcon(file)}
              <button onClick={() => deleteButton(file.name)} className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs cursor-pointer bg-red-600">X</button>
              <p className="text-[10px]">{file.name}</p>
            </li>
          ))}
        </ul>
      )}
      <p>{files.length > 0 ? "" : isDragActive ? "Drag and drop your file here" : "Drag files, or click to upload."}</p>
    </div>
</div>
    </>
  )
}

export default FileDropzone;

// http://localhost:5173/upload/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cGxvYWRMaW5rSWQiOiJkYWNlOWViYS0wOGMwLTRmNDktYWMxOC01ZjUzYzQwMGQyYjUiLCJjbGllbnRJZCI6ImM4NDg5MzgzLWEzYWMtNGFmOS1hODM3LTRmODkyM2E5ZDFiZCIsInR5cGUiOiJhdXRoIiwiaWF0IjoxNzcyMTQ1NzYxfQ.sKmnf7JMBYoLeUdtd9yY4tB42GkeLQa7FKhbOkiZq1s