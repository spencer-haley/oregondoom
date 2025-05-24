import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  return (
    <>
      <Navbar />
      <div className="p-6 text-doomGreen max-w-screen-md mx-auto">
        <h1 className="text-6xl font-metal text-doomGrey mb-6 text-center">Admin Panel</h1>
        <div className="space-y-4">
          <Link to="/admin/new-events" className="block p-4 border border-doomGreen rounded hover:bg-doomGreen hover:text-black font-bold">Create New Events</Link>
          <Link to="/admin/delete-past-events" className="block p-4 border border-doomGreen rounded hover:bg-doomGreen hover:text-black font-bold">Batch Delete Past Events</Link>
          <Link to="/admin/manage-events" className="block p-4 border border-doomGreen rounded hover:bg-doomGreen hover:text-black font-bold">Manage Future Events</Link>
          <Link to="/admin/new-release" className="block p-4 border border-doomGreen rounded hover:bg-doomGreen hover:text-black font-bold">Create New Releases</Link>
          <Link to="/admin/manage-releases" className="block p-4 border border-doomGreen rounded hover:bg-doomGreen hover:text-black font-bold">Manage Releases</Link>
        </div>
      </div>
    </>
  );
}
