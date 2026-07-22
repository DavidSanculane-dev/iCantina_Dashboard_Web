export default function Footer() {
  return (
    <footer className="mt-8 border-t border-slate-100 py-4 text-center text-xs text-slate-400">
      iCantina - Desenvolvido com{" "}
      <span className="text-red-500" aria-label="amor">
        ❤️
      </span>{" "}
      por{" "}
      <a
        href="https://www.linkedin.com/in/david-sanculane-143b4141/"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-brand-greenDark hover:underline"
      >
        David Sanculane
      </a>
    </footer>
  );
}