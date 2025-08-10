// Importaciones necesarias
import { type FormEvent, useState } from "react"; // Hooks y tipado para eventos de formulario
import Navbar from "~/components/Navbar"; // Componente de barra de navegación
import FileUploader from "~/components/FileUploader"; // Componente para subir archivos
import { usePuterStore } from "~/lib/puter"; // Custom hook para acceder a servicios globales
import { useNavigate } from "react-router"; // Hook para redirigir entre páginas
import { convertPdfToImage } from "~/lib/pdf2img"; // Función para convertir PDF a imagen
import { generateUUID } from "~/lib/utils"; // Generador de identificadores únicos
import { prepareInstructions } from "../../constants"; // Función para preparar instrucciones para la IA

// Componente principal
const Upload = () => {
  // Desestructuramos funciones y estados del store global
  const { auth, isLoading, fs, ai, kv } = usePuterStore();

  // Hook para redireccionar
  const navigate = useNavigate();

  // Estados locales
  const [isProcessing, setIsProcessing] = useState(false); // Si el proceso está en ejecución
  const [statusText, setStatusText] = useState(""); // Texto de estado para el usuario
  const [file, setFile] = useState<File | null>(null); // Archivo seleccionado

  // Función para manejar cuando se selecciona un archivo
  const handleFileSelect = (file: File | null) => {
    setFile(file); // Guardamos el archivo en el estado
  };

  // Función principal para procesar y analizar el CV
  const handleAnalyze = async ({
    companyName,
    jobTitle,
    jobDescription,
    file,
  }: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    file: File;
  }) => {
    setIsProcessing(true); // Indicamos que estamos procesando

    // 1. Subir el archivo PDF
    setStatusText("Uploading the file...");
    const uploadedFile = await fs.upload([file]); // Subida usando servicio fs
    if (!uploadedFile) return setStatusText("Error: Failed to upload file");

    // 2. Convertir el PDF a imagen
    setStatusText("Converting to image...");
    const imageFile = await convertPdfToImage(file);
    if (!imageFile.file)
      return setStatusText("Error: Failed to convert PDF to image");

    // 3. Subir la imagen resultante
    setStatusText("Uploading the image...");
    const uploadedImage = await fs.upload([imageFile.file]);
    if (!uploadedImage) return setStatusText("Error: Failed to upload image");

    // 4. Preparar los datos para guardarlos en la base de datos
    setStatusText("Preparing data...");
    const uuid = generateUUID(); // Generar ID único
    const data = {
      id: uuid,
      resumePath: uploadedFile.path, // Ruta en el servidor del PDF
      imagePath: uploadedImage.path, // Ruta en el servidor de la imagen
      companyName,
      jobTitle,
      jobDescription,
      feedback: "", // Inicialmente vacío
    };
    await kv.set(`resume:${uuid}`, JSON.stringify(data)); // Guardar en base de datos clave-valor

    // 5. Pedir análisis a la IA
    setStatusText("Analyzing...");
    const feedback = await ai.feedback(
      uploadedFile.path,
      prepareInstructions({ jobTitle, jobDescription }) // Pasar instrucciones personalizadas
    );
    if (!feedback) return setStatusText("Error: Failed to analyze resume");

    // 6. Obtener texto de feedback (la respuesta puede ser string o arreglo de bloques de texto)
    const feedbackText =
      typeof feedback.message.content === "string"
        ? feedback.message.content
        : feedback.message.content[0].text;

    // 7. Guardar el feedback procesado
    data.feedback = JSON.parse(feedbackText);
    await kv.set(`resume:${uuid}`, JSON.stringify(data));

    // 8. Redirigir a la página de resultados
    setStatusText("Analysis complete, redirecting...");
    console.log(data);
    navigate(`/resume/${uuid}`);
  };

  // Función para manejar envío del formulario
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Evitar recarga de página
    const form = e.currentTarget.closest("form");
    if (!form) return;
    const formData = new FormData(form); // Capturamos datos del formulario

    const companyName = formData.get("company-name") as string;
    const jobTitle = formData.get("job-title") as string;
    const jobDescription = formData.get("job-description") as string;

    if (!file) return; // No continuar si no hay archivo

    // Llamamos al proceso de análisis
    handleAnalyze({ companyName, jobTitle, jobDescription, file });
  };

  // Renderizado del componente
  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Smart feedback for your dream job</h1>
          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img src="/images/resume-scan.gif" className="w-full" />
            </>
          ) : (
            <h2>Drop your resume for an ATS score and improvement tips</h2>
          )}

          {!isProcessing && (
            <form
              id="upload-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 mt-8"
            >
              {/* Campo de nombre de la empresa */}
              <div className="form-div">
                <label htmlFor="company-name">Company Name</label>
                <input
                  type="text"
                  name="company-name"
                  placeholder="Company Name"
                  id="company-name"
                />
              </div>

              {/* Campo de título del trabajo */}
              <div className="form-div">
                <label htmlFor="job-title">Job Title</label>
                <input
                  type="text"
                  name="job-title"
                  placeholder="Job Title"
                  id="job-title"
                />
              </div>

              {/* Campo de descripción del trabajo */}
              <div className="form-div">
                <label htmlFor="job-description">Job Description</label>
                <textarea
                  rows={5}
                  name="job-description"
                  placeholder="Job Description"
                  id="job-description"
                />
              </div>

              {/* Campo para subir el CV */}
              <div className="form-div">
                <label htmlFor="uploader">Upload Resume</label>
                <FileUploader onFileSelect={handleFileSelect} />
              </div>

              {/* Botón para enviar */}
              <button className="primary-button" type="submit">
                Analyze Resume
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default Upload;
