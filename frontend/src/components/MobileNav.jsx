import { useState } from 'react';

import { Link, useLocation, useSearchParams } from 'react-router-dom';

import { Menu, X } from 'lucide-react';

import Logo from './Logo';



const links = [

  { to: '/', label: 'Projects', key: 'projects' },

  { to: '/codes', label: 'All Codes', key: 'codes' },

  { to: '/teams', label: 'Teams', key: 'teams' },

  { to: '/?filter=starred', label: 'Starred', key: 'starred' },

  { to: '/settings', label: 'Settings', key: 'settings' },

];



const MobileNav = () => {

  const [open, setOpen] = useState(false);

  const { pathname } = useLocation();

  const [searchParams] = useSearchParams();

  const filter = searchParams.get('filter');



  const isActive = (key) => {

    if (key === 'projects') return pathname === '/' && !filter;

    if (key === 'codes') return pathname === '/codes';

    if (key === 'starred') return pathname === '/' && filter === 'starred';

    if (key === 'settings') return pathname === '/settings';

    return pathname === `/${key}`;

  };



  return (

    <div className="lg:hidden border-b border-zinc-800 bg-zinc-950/90 px-4 py-3 flex items-center justify-between relative">

      <Logo />

      <button type="button" onClick={() => setOpen(!open)} className="text-zinc-400">

        {open ? <X /> : <Menu />}

      </button>

      {open && (

        <div className="absolute top-14 left-0 right-0 bg-zinc-950 border-b border-zinc-800 z-50 p-4 space-y-2">

          {links.map((l) => (

            <Link

              key={l.key}

              to={l.to}

              onClick={() => setOpen(false)}

              className={`block py-2 ${

                isActive(l.key) ? 'text-violet-400 font-medium' : 'text-zinc-300'

              }`}

            >

              {l.label}

            </Link>

          ))}

        </div>

      )}

    </div>

  );

};



export default MobileNav;


