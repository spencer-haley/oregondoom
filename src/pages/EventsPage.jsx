import { useEffect, useState, useRef } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import Navbar from '../components/Navbar';

export default function EventsPage() {
  // === STATE MANAGEMENT ===
  const [events, setEvents] = useState([]);                 // Stores upcoming, approved events
  const [cities, setCities] = useState([]);                 // Stores list of unique cities with event counts
  const [selectedCity, setSelectedCity] = useState('All');  // Tracks which city is currently selected for filtering
  const [narratives, setNarratives] = useState({});         // Maps event IDs to their narrative overlays
  const [expandedId, setExpandedId] = useState(null);       // Tracks which event (if any) is expanded on mobile
  const overlayRef = useRef(null);                          // Reference to the active overlay element (for outside-click detection)

  // === FETCH EVENTS AND NARRATIVES ON INITIAL RENDER ===
  useEffect(() => {
    async function fetchEvents() {
      const now = new Date();

      // Query Firestore for approved events in the future, sorted by date
      const eventsQuery = query(
        collection(db, 'events'),
        where('approvalStatus', '==', true),
        where('eventDate', '>=', now),
        orderBy('eventDate')
      );

      const snapshot = await getDocs(eventsQuery);
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(fetched);

      // Build city list with counts for filter buttons
      const counts = {};
      for (const e of fetched) {
        counts[e.eventCity] = (counts[e.eventCity] || 0) + 1;
      }

      setCities([
        { name: 'All', count: fetched.length },
        ...Object.entries(counts)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([name, count]) => ({ name, count })),
      ]);
    }

    async function fetchNarratives() {
      try {
        // Fetch narrative JSON from Firebase Storage (external to Firestore)
        const res = await fetch('/narrativeByEventId.json');
        const data = await res.json();
        setNarratives(data);
      } catch (err) {
        console.error("❌ Error loading narratives:", err);
      }
    }

    fetchEvents();
    fetchNarratives();
  }, []);

  // === HANDLE OUTSIDE CLICKS TO DISMISS MOBILE OVERLAYS ===
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        overlayRef.current &&
        !overlayRef.current.contains(e.target)
      ) {
        setExpandedId(null); // Close if tapped outside the overlay
      }
    }

    if (expandedId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expandedId]);

  // === FILTER EVENTS BASED ON SELECTED CITY ===
  const filteredEvents =
    selectedCity === 'All'
      ? events
      : events.filter(event => event.eventCity === selectedCity);

  return (
    <>
      <Navbar />

      <div className="p-6 text-doomGreen">
        {/* === PAGE HEADER === */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-metal text-doomGrey">Oregon Doom Events</h1>
          <p className="text-2xl text-doomGreen mt-2">
            Upcoming doom and doom-adjacent events across or near Oregon
          </p>
        </div>

        {/* === CITY FILTER BUTTONS === */}
        <div className="flex flex-wrap gap-3 mb-6 justify-center">
          {cities.map(city => (
            <button
              key={city.name}
              onClick={() => setSelectedCity(city.name)}
              className={`px-3 py-1 border rounded-full font-bold uppercase text-sm transition-all ${
                selectedCity === city.name
                  ? 'bg-doomGreen text-black'
                  : 'border-doomGreen text-doomGreen hover:bg-doomGreen hover:text-black'
              }`}
              aria-pressed={selectedCity === city.name}
            >
              {city.name} ({city.count})
            </button>
          ))}
        </div>

        {/* === EVENT GRID === */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map(event => (
            <div
              key={event.id}
              className="relative group bg-black rounded-lg p-4 shadow-md overflow-hidden"
            >
              {/* === FLYER IMAGE AND OVERLAYS === */}
              {event.eventFlyerURL && (
                <div
                  className="relative cursor-pointer"
                  onClick={() => setExpandedId(prev => (prev === event.id ? null : event.id))}
                  aria-label={`Flyer for ${event.eventName}`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setExpandedId(prev => (prev === event.id ? null : event.id));
                  }}
                >
                  <img
                    src={event.eventFlyerURL}
                    alt={`Flyer for ${event.eventName}`}
                    className="w-full h-auto rounded mb-3"
                  />

                  {/* === DESKTOP: HOVER-BASED OVERLAY === */}
                  {narratives[event.id] && (
                    <div
                      className="hidden md:flex absolute inset-0 bg-black bg-opacity-80 p-4 text-sm overflow-y-auto transition-opacity duration-300 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                      aria-hidden="true"
                    >
                      <div
                        className="whitespace-pre-wrap font-sans text-doomGrey"
                        dangerouslySetInnerHTML={{ __html: narratives[event.id] }}
                      />
                    </div>
                  )}

                  {/* === MOBILE: TAP-TO-EXPAND OVERLAY === */}
                  {narratives[event.id] && expandedId === event.id && (
                    <div
                      className="block md:hidden absolute inset-0 bg-black bg-opacity-90 p-4 text-sm overflow-y-auto z-10 rounded transition-opacity duration-300 opacity-100"
                      role="dialog"
                      aria-modal="true"
                      aria-label={`Details for ${event.eventName}`}
                      ref={overlayRef}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(null);
                        }}
                        className="absolute top-2 right-3 text-white text-lg font-bold"
                        aria-label="Close overlay"
                      >
                        ✕
                      </button>
                      <div
                        className="mt-6 whitespace-pre-wrap font-sans text-doomGrey"
                        dangerouslySetInnerHTML={{ __html: narratives[event.id] }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* === EVENT TEXT CONTENT === */}
              <h2 className="text-xl font-bold text-doomGreen">{event.eventName}</h2>
              {event.eventNotes && (
                <p className="text-sm italic text-gray-400 mt-1">{event.eventNotes}</p>
              )}
              <p className="mt-2">
                {new Date(event.eventDate.seconds * 1000).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'numeric',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              <p>{event.eventVenue}, {event.eventCity}</p>
              {event.eventTicketsURL && (
                <a
                  href={event.eventTicketsURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-doomGreen font-bold inline-block mt-1"
                >
                  🎟️ Tickets/Venue Information
                </a>
              )}
            </div>
          ))}
        </div>

        {/* === NO RESULTS MESSAGE === */}
        {filteredEvents.length === 0 && (
          <p className="mt-10 text-center text-gray-500">No events found for this city.</p>
        )}
      </div>
    </>
  );
}
