import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone"; // Librería para manejar "drag and drop" de archivos
import { formatSize } from "../lib/utils"; // Función para formatear tamaños (bytes a KB/MB)

// Definición de props que acepta este componente
interface FileUploaderProps {
  onFileSelect?: (file: File | null) => void; // Callback para notificar al padre qué archivo se seleccionó
}

// Componente principal
const FileUploader = ({ onFileSelect }: FileUploaderProps) => {
  // Función que se ejecuta cuando se suelta o selecciona un archivo
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0] || null; // Tomamos el primer archivo o null si no hay ninguno
      onFileSelect?.(file); // Si existe el callback, le pasamos el archivo al componente padre
    },
    [onFileSelect] // Solo se vuelve a crear si cambia onFileSelect
  );

  // Límite de tamaño en bytes (20 MB)
  const maxFileSize = 20 * 1024 * 1024;

  // Configuración del dropzone
  const { getRootProps, getInputProps, isDragActive, acceptedFiles } =
    useDropzone({
      onDrop, // Función que se ejecuta al soltar un archivo
      multiple: false, // Solo permite un archivo
      accept: { "application/pdf": [".pdf"] }, // Solo PDFs
      maxSize: maxFileSize, // Tamaño máximo
    });

  // Tomamos el archivo seleccionado actualmente
  const file = acceptedFiles[0] || null;

  return (
    <div className="w-full gradient-border">
      {/* Área donde el usuario puede arrastrar/soltar o hacer click */}
      <div {...getRootProps()}>
        {/* Input real oculto para manejar selección manual */}
        <input {...getInputProps()} />

        <div className="space-y-4 cursor-pointer">
          {file ? (
            // Si hay un archivo seleccionado, mostrar sus datos
            <div
              className="uploader-selected-file"
              onClick={(e) => e.stopPropagation()} // Evita que al hacer click en el contenido se vuelva a abrir el selector
            >
              {/* Icono PDF */}
              <img src="/images/pdf.png" alt="pdf" className="size-10" />

              {/* Información del archivo */}
              <div className="flex items-center space-x-3">
                <div>
                  {/* Nombre del archivo */}
                  <p className="text-sm font-medium text-gray-700 truncate max-w-xs">
                    {file.name}
                  </p>
                  {/* Tamaño del archivo */}
                  <p className="text-sm text-gray-500">
                    {formatSize(file.size)}
                  </p>
                </div>
              </div>

              {/* Botón para eliminar el archivo */}
              <button
                className="p-2 cursor-pointer"
                onClick={(e) => {
                  onFileSelect?.(null); // Notificamos que no hay archivo seleccionado
                }}
              >
                <img src="/icons/cross.svg" alt="remove" className="w-4 h-4" />
              </button>
            </div>
          ) : (
            // Si NO hay archivo seleccionado, mostrar instrucciones
            <div>
              <div className="mx-auto w-16 h-16 flex items-center justify-center mb-2">
                <img src="/icons/info.svg" alt="upload" className="size-20" />
              </div>
              <p className="text-lg text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag
                and drop
              </p>
              <p className="text-lg text-gray-500">
                PDF (max {formatSize(maxFileSize)})
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
