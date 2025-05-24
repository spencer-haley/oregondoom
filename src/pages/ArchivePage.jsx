import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Papa from 'papaparse';

export default function ArchivePage() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('');
  const [city, setCity] = useState('');
  const [venue, setVenue] = useState('');
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    async function loadCSV() {
      try {
        const response = await fetch(
          'https://firebasestorage.googleapis.com/v0/b/oregondoom.firebasestorage.app/o/site_assets%2FOregonDoomShowChronicling.csv?alt=media&token=6424c9c5-e701-4535-b282-dedb7eda843a'
        );
        const text = await response.text();
        const { data } = Papa.parse(text, { header: true });
        const parsed = data.filter(e => e.Date && e["Band(s)"]);
        setEvents(parsed);
        setFilteredEvents(parsed);
      } catch (error) {
        console.error('❌ Failed to load CSV:', error);
      }
    }
    loadCSV();
  }, []);

  useEffect(() => {
    const filtered = events.filter(e => {
      return (
        (!search || e["Band(s)"].toLowerCase().includes(search.toLowerCase())) &&
        (!year || e.Date.includes(year)) &&
        (!city || e.City?.toLowerCase().includes(city.toLowerCase())) &&
        (!venue || e.Venue?.toLowerCase().includes(venue.toLowerCase()))
      );
    });
    setFilteredEvents(filtered);
  }, [search, year, city, venue, events]);

  const totalEvents = events.length;
  const totalBands = new Set(events.flatMap(e => e["Band(s)"].split('|').map(b => b.trim()))).size;
  const cities = new Set(events.map(e => e.City));
  const venues = new Set(events.map(e => e.Venue));

  return (
    <>
      <Navbar />
      <div className="p-6 text-doomGreen max-w-screen-xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-metal text-doomGrey">Oregon Doom Archive</h1>
          <p className="text-2xl text-doomGreen mt-2">
            Oregon doom and doom-adjacent concert archive — 2000-present
          </p>
        </div>

        <div className="flex flex-wrap gap-4 justify-center mb-4">
          <button
            onClick={() => setShowStats(!showStats)}
            className="border border-doomGreen px-4 py-1 rounded hover:bg-doomGreen hover:text-black"
          >
            📊 Toggle Stats
          </button>
          <a
            href="https://firebasestorage.googleapis.com/v0/b/oregondoom.firebasestorage.app/o/site_assets%2FOregonDoomShowChronicling.csv?alt=media&token=6424c9c5-e701-4535-b282-dedb7eda843a"
            download
            className="border border-doomGreen px-4 py-1 rounded hover:bg-doomGreen hover:text-black"
          >
            📥 Download CSV
          </a>
          <button
            onClick={() => {
              setSearch('');
              setYear('');
              setCity('');
              setVenue('');
            }}
            className="border border-doomGreen px-4 py-1 rounded hover:bg-doomGreen hover:text-black"
          >
            🔎 Clear All Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <input
            type="text"
            placeholder="Band name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-black border border-doomGreen px-3 py-1 text-doomGreen placeholder-gray-500 rounded"
          />
          <input
            type="text"
            placeholder="Year..."
            value={year}
            onChange={e => setYear(e.target.value)}
            className="bg-black border border-doomGreen px-3 py-1 text-doomGreen placeholder-gray-500 rounded"
          />
          <input
            type="text"
            placeholder="City..."
            value={city}
            onChange={e => setCity(e.target.value)}
            className="bg-black border border-doomGreen px-3 py-1 text-doomGreen placeholder-gray-500 rounded"
          />
          <input
            type="text"
            placeholder="Venue name..."
            value={venue}
            onChange={e => setVenue(e.target.value)}
            className="bg-black border border-doomGreen px-3 py-1 text-doomGreen placeholder-gray-500 rounded"
          />
        </div>

        {showStats && (
          <div className="bg-black border border-doomGreen rounded-lg p-4 mb-6 text-doomGreen">
            <p><strong>Total Events:</strong> {totalEvents.toLocaleString()}</p>
            <p><strong>Unique Bands:</strong> {totalBands.toLocaleString()}</p>
            <p><strong>Cities Represented:</strong> {cities.size}</p>
            <p><strong>Venues Listed:</strong> {venues.size}</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
              <div>
                <h2 className="font-bold mb-2">Archived Shows in Oregon</h2>
                <ul className="list-disc list-inside">
                  {Object.entries(
                    events.reduce((acc, e) => {
                      e["Band(s)"].split('|').map(b => b.trim()).forEach(band => {
                        acc[band] = (acc[band] || 0) + 1;
                      });
                      return acc;
                    }, {})
                  )
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 25)
                    .map(([band, count]) => (
                      <li key={band}>{band}: {count}</li>
                    ))}
                </ul>
              </div>
              <div>
                <h2 className="font-bold mb-2">Most Archived Oregon Cities</h2>
                <ul className="list-disc list-inside">
                  {Object.entries(
                    events.reduce((acc, e) => {
                      acc[e.City] = (acc[e.City] || 0) + 1;
                      return acc;
                    }, {})
                  )
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 25)
                    .map(([city, count]) => (
                      <li key={city}>{city}: {count}</li>
                    ))}
                </ul>
              </div>
              <div>
                <h2 className="font-bold mb-2">Most Archived Oregon Venues</h2>
                <ul className="list-disc list-inside">
                  {Object.entries(
                    events.reduce((acc, e) => {
                      acc[e.Venue] = (acc[e.Venue] || 0) + 1;
                      return acc;
                    }, {})
                  )
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 25)
                    .map(([venue, count]) => (
                      <li key={venue}>{venue}: {count}</li>
                    ))}
                </ul>
              </div>
              <div>
                <h2 className="font-bold mb-2">Archived Shows Per Year</h2>
                <ul className="list-disc list-inside">
                  {Object.entries(
                    events.reduce((acc, e) => {
                      const year = e.Date?.split('/')[2]?.trim();
                      if (year) acc[year] = (acc[year] || 0) + 1;
                      return acc;
                    }, {})
                  )
                    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                    .map(([year, count]) => (
                      <li key={year}>{year}: {count}</li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <p className="text-sm text-gray-400 mb-4">
          {filteredEvents.length.toLocaleString()} event(s) found
        </p>

        <div className="space-y-4">
          {filteredEvents.map((e, i) => (
            <div key={i} className="border border-doomGreen rounded-lg p-4">
              <p className="font-bold text-doomGreen">
                {e.Date} • {e.Venue} • {e.City}
              </p>
              <p className="text-doomGreen italic mt-1">Band(s): {e["Band(s)"]}</p>
            </div>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <p className="mt-10 text-center text-gray-500">No matching archived events found.</p>
        )}
      </div>
    </>
  );
}
