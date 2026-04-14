import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { File, FileText, Image, Hourglass, ThumbsUp, ThumbsDown } from "lucide-react";

type FileDropzoneProps = { maxFiles?: number };

function FileDropzone({ maxFiles = 1 }: FileDropzoneProps) {
 type UploadFile = {
  file: File;
  progress: number;
  speed: number;
  timeRemaining: number;
  status: "uploading" | "success" | "error";
};

const [files, setFiles] = useState<UploadFile[]>([]);
const [lastBatchSize, setLastBatchSize] = useState(0);
const [showTimeRemaining, setShowTimeRemaining] = useState(true);
const [showSpeed, setShowSpeed] = useState(true);
const [showBatchProgress, setShowBatchProgress] = useState(true);


 const handleUpload = (fileObj: UploadFile,
 index: number
) => {
  const xhr = new XMLHttpRequest();
  const startTime = Date.now();

  xhr.open("POST", "/the-upload-endpoint"); // replace with the actual upload URL

  xhr.upload.onprogress = (evt) => {
    if (!evt.lengthComputable) return;

    const progress = (evt.loaded / evt.total) * 100;

    const elapsedTime = (Date.now() - startTime) / 1000;
    const speed = elapsedTime > 0 ? evt.loaded / elapsedTime / 1024 : 0;;

    const remainingBytes = evt.total - evt.loaded;
    const timeRemaining = speed > 0 ? remainingBytes / (speed * 1024) : 0;

    setFiles((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          return {
            ...item,
            progress,
            speed,
            timeRemaining,
          };
        }
        return item;
      })
    );
  };

  xhr.onload = () => {
    setFiles((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, status: "success", progress: 100 }
          : item
      )
    );
  };

  xhr.onerror = () => {
    setFiles((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, status: "error" }
          : item
      )
    );
  };

  const formData = new FormData();
  formData.append("file", fileObj.file);

  xhr.send(formData);
};

const onDrop = (acceptedFiles: File[]) => {
  setFiles((prev) => {
    const remainingSlots = maxFiles - prev.length;

    if (remainingSlots <= 0) return prev;

    const slicedFiles = acceptedFiles.slice(0, remainingSlots);
    setLastBatchSize(slicedFiles.length);

    const filesToAdd = slicedFiles.map((file): {
  file: File;
  progress: number;
  speed: number;
  timeRemaining: number;
  status: "uploading" | "success" | "error";
} => ({
  file,
  progress: 0,
  speed: 0,
  timeRemaining: 0,
  status: "uploading",
}));

    const updatedFiles = [...prev, ...filesToAdd];

    filesToAdd.forEach((fileObj, i) => {
      handleUpload(fileObj, prev.length + i);
    });

    return updatedFiles;
  });
};




const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
  onDrop,
  accept: {
    "image/*": [],
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "application/vnd.ms-excel": [".xls"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"]
  },
  maxSize: 40 * 1024 * 1024,
  maxFiles: maxFiles,
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

const deleteButton = (evt: React.MouseEvent<HTMLButtonElement>, index: number) => {
  evt.preventDefault();
  evt.stopPropagation();
  setFiles((prev) => prev.filter((_, i) => i !== index));
};

const retryUpload = (index: number) => {
  setFiles((prev) => {
    const updated = prev.map((item, i) => {
      if (i === index) {
        const resetItem = {
          ...item,
          progress: 0,
          speed: 0,
          timeRemaining: 0,
          status: "uploading" as const,
        };

        handleUpload(resetItem, index);

        return resetItem;
      }
      return item;
    });

    return updated;
  });
};

const getStatusIcon = (status: "uploading" | "success" | "error") => {
  if(status === "uploading") {
    return <Hourglass className="h-4 w-4 text-gray-500 animate-spin" />
  }
  if(status === "success") {
    return <ThumbsUp className="h-4 w-4 text-green-500" />
  }
  if(status === "error") {
    return <ThumbsDown className="h-4 w-4 text-red-500" />
  }
  return null;
};

const batchSpeed = files.reduce((sum, file) => sum + file.speed, 0);

const batchProgress =
  lastBatchSize > 0
    ? files.reduce((sum, file) => sum + file.progress, 0) / files.length
    : 0;

const batchTimeRemaining = files.reduce((sum, file) => sum + file.timeRemaining, 0);

const stillUploading = files.some(file => file.status === "uploading");

useEffect(() => {
  if (!stillUploading) {
    setTimeout(() => {
      setShowTimeRemaining(false);
      setShowSpeed(false);
      setShowBatchProgress(false);
    }, 2000);
  } else {
    setShowTimeRemaining(true);
    setShowSpeed(true);
    setShowBatchProgress(true);
  }
}, [stillUploading]);

  return(
    <>
    <div className="flex-col">
    <div className={`relative border-2 border-dashed rounded-md p-8 cursor-pointer
    max-w-max
  flex items-center flex-wrap
  text-center
  transition-all duration-200
  ${
    isDragActive
      ? "border-blue-500 bg-blue-50 scale-[1.02]"
      : "border-gray-400"
  }`} {...getRootProps()}>
      <input {...getInputProps()} />
      {files.length > 0 && (
        <ul className="flex gap-5">
          {files.map((file, index) => (
            <li className="relative max-w-[75px]" key={index}>
              {getFileIcon(file.file)}
              <button onClick={(evt) => deleteButton(evt, index)} className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs cursor-pointer bg-red-600">X</button>
              <p className="text-[10px] truncate">{file.file.name}</p>
              {file.status === "error" && (
  <button
    onClick={(evt) => {
      evt.stopPropagation();
      retryUpload(index);
    }}
    className="absolute bottom-[2.1em] left-[-2px] right-[-2px] text-xs bg-gray-500 text-white border-0 rounded-md py-[0 3px]"
  >
    Retry
  </button>
)}
<div className="w-full bg-gray-200 h-1 mt-1">
  <div
    className="bg-blue-500 h-1"
    style={{ width: `${file.progress}%` }}
  />
</div>
<div className="flex items-center justify-between text-xs mt-1">
  <span className="text-sm">{Math.round(file.progress)}%</span>
  <span>{getStatusIcon(file.status)}</span>
</div>
            </li>
          ))}
        </ul>
      )}
      <p className="mx-auto">{files.length > 0 ? "" : "Drag files, or click to upload."}</p>
      {files.length > 0 && (
        <p className={`${showTimeRemaining ? "opacity-100" : "transition-opacity duration-1000 opacity-0"} absolute bottom-0 right-[25px] text-sm`}>{batchTimeRemaining.toFixed(0)}s remaining</p>
      )}
       {lastBatchSize > 1 && (
        <div className={`${showBatchProgress ? "opacity-100" : "transition-opacity duration-1000 opacity-0"} absolute bottom-[85px] right-[-95px] w-[150px]`}>
    <div className="bg-blue-500 transform -rotate-90 rounded"
    style={{ width: `${batchProgress}%` }}>
        {batchProgress.toFixed(0)}%
    </div>
    </div>
  )}
{files.length > 0 && (
  <p className={`${showSpeed ? "opacity-100" : "transition-opacity duration-1000 opacity-0"} absolute bottom-[-25px] left-[15px] text-sm text-gray-600 mt-2`}>
    {batchSpeed.toFixed(2)} KB/s
  </p>
)}
</div>
    {fileRejections.map((rejects) => {
      if(rejects.errors[0].code === "file-too-large") {
        return <p key={rejects.file.name}>{rejects.file.name} must be less than 40MB</p>
      }
      if(rejects.errors[0].code === "file-invalid-type") {
        return <p key={rejects.file.name}>{rejects.file.name} is an unsupported file type</p>
      }
      if(rejects.errors[0].code === "too-many-files") {

      }
    })}
</div>
    </>
  )
}

export default FileDropzone;