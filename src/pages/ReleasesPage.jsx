import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import Navbar from '../components/Navbar';

const CURRENT_YEAR = 2025;
const ITEMS_PER_PAGE = 12;

export default function ReleasesPage() {
  const [releases, setReleases] = useState([]);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [search, setSearch] = useState('');
  const [doomChartOnly, setDoomChartOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  useEffect(() => {
    async function fetchReleases() {
      const q = query(collection(db, 'releases_v2'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReleases(results);
    }

    fetchReleases();
  }, []);

  const filtered = releases.filter(release => {
    const matchesYear = !search && !doomChartOnly ? release.year === year : true;
    const matchesSearch = [release.artist, release.title]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesDoomChart = !doomChartOnly || release.doomchart === true;
    return matchesYear && matchesSearch && matchesDoomChart;
  });

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 &&
        visibleCount < filtered.length
      ) {
        setVisibleCount(prev => prev + ITEMS_PER_PAGE);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [visibleCount, filtered.length]);

  const clearFilters = () => {
    setYear(CURRENT_YEAR);
    setSearch('');
    setDoomChartOnly(false);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  return (
    <>
      <Navbar />
      <div className="p-6 text-doomGreen max-w-screen-xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-metal text-doomGrey">Oregon Doom Releases</h1>
          <p className="text-2xl text-doomGreen mt-2">
            Oregon-based doom and doom-adjacent releases — curated via Bandcamp
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6 justify-center">
          <input
            type="text"
            placeholder="🔍 Search artist, album..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-black border border-doomGreen px-3 py-1 text-doomGreen placeholder-gray-500 rounded"
          />
          <button
            onClick={clearFilters}
            className="border border-doomGreen px-3 py-1 rounded text-sm hover:bg-doomGreen hover:text-black"
          >
            Clear All Filters
          </button>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={doomChartOnly}
              onChange={() => setDoomChartOnly(!doomChartOnly)}
            />
            <span className="text-sm">
              <span className="underline text-doomGreen">Doom Charts</span> Featured Releases
            </span>
          </label>
        </div>

        {/* Year Buttons */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {Array.from({ length: 30 }, (_, i) => 2025 - i).map(y => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`px-3 py-1 rounded text-sm font-bold ${
                year === y
                  ? 'bg-doomGreen text-black'
                  : 'border border-doomGreen text-doomGreen hover:bg-doomGreen hover:text-black'
              }`}
            >
              {`’${String(y).slice(2)}`}
            </button>
          ))}
        </div>

        {/* Release Cards */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.slice(0, visibleCount).map(release => (
            <div
              key={release.id}
              className="bg-black border border-gray-700 rounded-xl p-4 flex flex-col items-center text-center shadow-md"
            >
              {/* Bandcamp Embed */}
              {release.embed && (
                <div className="mb-4">
                  <div
                    dangerouslySetInnerHTML={{ __html: release.embed }}
                  />
                </div>
              )}

              <h2 className="font-bold text-doomGreen text-lg">
                {release.artist} ({release.location})
              </h2>
              <p className="italic text-gray-400">{release.title}</p>
              <p className="text-sm text-doomGreen mt-1">
                {release.date?.seconds && new Date(release.date.seconds * 1000).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          ))}
        </div>

        {visibleCount < filtered.length && (
          <p className="mt-10 text-center text-gray-500 animate-pulse">Loading more releases…</p>
        )}

        {filtered.length === 0 && (
          <p className="mt-10 text-center text-gray-500">No releases found.</p>
        )}
      </div>
    </>
  );
}
