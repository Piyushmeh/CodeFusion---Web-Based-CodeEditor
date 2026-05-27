import { Hexagon } from 'lucide-react';
import { Link } from 'react-router-dom';

const Logo = ({ className = '', linkTo = '/' }) => (
  <Link to={linkTo} className={`flex items-center gap-2.5 ${className}`}>
    <Hexagon className="w-8 h-8 text-[#7c5cff] fill-[#7c5cff]/15 stroke-[1.5]" />
    <span className="text-xl font-bold text-white tracking-tight">CodeFusion</span>
  </Link>
);

export default Logo;
