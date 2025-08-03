import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart feedback for yout dream job!!" },
  ];
}

export default function Home() {
  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className="main-section">
        <div className="page-heading">
          <h1>Track Your Applications & Resume Ratings</h1>
          <h2>Review Your Submissions And Check AI-Powered feedback.</h2>
        </div>
      </section>

      {resumes.lenght > 0 && (
      <div className="resumes-section">
        {resumes.map( callbackfn:(resume) => (
        <ResumeCard key={resume.id} resume={resume} />
        ))}
      </div>
      )}

      
    </main>
  );
}
