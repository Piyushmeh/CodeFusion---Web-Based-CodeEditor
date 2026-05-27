import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

const Layout = ({ children, projectCount }) => (
  <div className="h-screen bg-dark flex overflow-hidden">
    <Sidebar projectCount={projectCount} />
    <div className="flex-1 flex flex-col min-w-0">
      <MobileNav />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
    </div>
  </div>
);

export default Layout;
