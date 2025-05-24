import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import Navbar from '../components/Navbar';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('All');

  useEffect(() => {
    async function fetchEvents() {
      const now = new Date();
      const eventsQuery = query(
        collection(db, 'events'),
        where('approvalStatus', '==', true),
        where('eventDate', '>=', now),
        orderBy('eventDate')
      );

      const snapshot = await getDocs(eventsQuery);
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(fetched);

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

    fetchEvents();
  }, []);

  const filteredEvents =
    selectedCity === 'All'
      ? events
      : events.filter(event => event.eventCity === selectedCity);

  return (
    <>
      <Navbar />
      <div className="p-6 text-doomGreen">

        {/* Doom Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-metal text-doomGrey">Oregon Doom Events</h1>
          <p className="text-2xl text-doomGreen mt-2">
            Upcoming doom and doom-adjacent events across Oregon
          </p>
        </div>

        {/* City Filters */}
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
            >
              {city.name} ({city.count})
            </button>
          ))}
        </div>

        {/* Event Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map(event => (
            <div key={event.id} className="bg-black rounded-lg p-4 shadow-md">
              {event.eventFlyerURL && (
                <img
                  src={event.eventFlyerURL}
                  alt={`Flyer for ${event.eventName}`}
                  className="w-full h-auto rounded mb-3"
                />
              )}
              <h2 className="text-xl font-bold text-doomGreen">{event.eventName}</h2>

              {/* Supporting Acts */}
              {event.eventNotes && (
                <p className="text-sm italic text-gray-400 mt-1">{event.eventNotes}</p>
              )}

              {/* Date */}
              <p className="mt-2">
                {new Date(event.eventDate.seconds * 1000).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'numeric',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>

              {/* Venue & City */}
              <p>{event.eventVenue}, {event.eventCity}</p>

              {/* Ticket Link */}
              {event.eventTicketsURL && (
                <a
                  href={event.eventTicketsURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-doomGreen underline inline-block mt-1"
                >
                  Get Tickets
                </a>
              )}
            </div>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <p className="mt-10 text-center text-gray-500">No events found for this city.</p>
        )}
      </div>
    </>
  );
}
