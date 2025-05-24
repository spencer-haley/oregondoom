import { useEffect, useState } from "react";
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  where
} from "firebase/firestore";
import { db } from "../../firebase";
import Navbar from "../../components/Navbar";

export default function ManageReleases() {
  const [releases, setReleases] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchRecentReleases();
  }, []);

  async function fetchRecentReleases() {
    try {
      const q = query(
        collection(db, "releases_v2"),
        orderBy("date", "desc"),
        limit(25)
      );
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReleases(fetched);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }

  async function handleSearch() {
    if (!search.trim()) {
      fetchRecentReleases();
      return;
    }
    try {
      const terms = search.toLowerCase().split(" ");
      const q = query(
        collection(db, "releases_v2"),
        where("usersearch", "array-contains-any", terms)
      );
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReleases(fetched);
    } catch (err) {
      console.error("Search error:", err);
    }
  }

  const handleChange = (id, field, value) => {
    setReleases(prev =>
      prev.map(r => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleSave = async (release) => {
    try {
      await updateDoc(doc(db, "releases_v2", release.id), release);
      setMessage("✅ Release updated");
    } catch (err) {
      console.error("Update error:", err);
      setMessage("❌ Update failed");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "releases_v2", id));
      setReleases(prev => prev.filter(r => r.id !== id));
      setMessage("🗑️ Release deleted");
    } catch (err) {
      console.error("Delete error:", err);
      setMessage("❌ Delete failed");
    }
  };

  return (
    <>
      <Navbar />
      <div className="p-6 text-doomGreen max-w-screen-xl mx-auto">
        <h1 className="text-5xl font-metal text-doomGrey mb-6 text-center">Manage Releases</h1>
        {message && <p className="text-center mb-4">{message}</p>}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by artist, title, location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-black border border-doomGreen p-2 rounded"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-doomGreen text-black rounded"
          >
            🔍 Search
          </button>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {releases.map(release => (
            <div key={release.id} className="bg-black p-4 border border-doomGreen rounded space-y-2">
              <input
                className="w-full bg-black border border-doomGreen p-1 rounded"
                value={release.artist || ""}
                onChange={e => handleChange(release.id, "artist", e.target.value)}
              />
              <input
                className="w-full bg-black border border-doomGreen p-1 rounded"
                value={release.title || ""}
                onChange={e => handleChange(release.id, "title", e.target.value)}
              />
              <input
                className="w-full bg-black border border-doomGreen p-1 rounded"
                value={release.location || ""}
                onChange={e => handleChange(release.id, "location", e.target.value)}
              />
              <input
                className="w-full bg-black border border-doomGreen p-1 rounded"
                value={release.format || ""}
                onChange={e => handleChange(release.id, "format", e.target.value)}
              />
              <textarea
                className="w-full bg-black border border-doomGreen p-1 rounded"
                value={release.embed || ""}
                onChange={e => handleChange(release.id, "embed", e.target.value)}
              />
              <input
                type="date"
                className="w-full bg-black border border-doomGreen p-1 rounded"
                value={release.date?.toDate?.().toISOString().split('T')[0] || ""}
                onChange={e => handleChange(release.id, "date", new Date(e.target.value))}
              />
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={!!release.doomchart}
                  onChange={e => handleChange(release.id, "doomchart", e.target.checked)}
                />
                <span>Doomchart</span>
              </label>
              <div className="flex justify-between">
                <button
                  onClick={() => handleSave(release)}
                  className="bg-doomGreen text-black px-3 py-1 rounded"
                >
                  💾 Save
                </button>
                <button
                  onClick={() => handleDelete(release.id)}
                  className="text-red-400 border border-red-400 px-3 py-1 rounded hover:bg-red-400 hover:text-black"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
