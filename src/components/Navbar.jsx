import { Link, useLocation } from 'react-router-dom';
import { FaInstagram } from 'react-icons/fa';

export default function Navbar() {
  const { pathname } = useLocation();

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`px-3 py-2 text-sm font-bold uppercase ${
        pathname === to
          ? 'text-doomGreen'
          : 'text-doomGrey hover:text-doomGreen'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="w-full bg-black border-b border-doomGreen p-4 flex flex-wrap justify-center gap-6">
      {navLink('/events', 'Events')}
      {navLink('/releases', 'Releases')}
      {navLink('/archive', 'Archive')}
      {navLink('/ecosystem', 'Ecosystem')}
      {navLink('/about', 'About')}
      <a
        href="https://www.instagram.com/oregondoom"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 px-3 py-2 text-sm font-bold uppercase text-doomGrey hover:text-doomGreen"
      >
        <FaInstagram className="text-lg" />
        Instagram
      </a>
    </nav>
  );
}
