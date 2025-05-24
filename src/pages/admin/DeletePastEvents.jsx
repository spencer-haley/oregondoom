import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  doc
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../../firebase";
import Navbar from "../../components/Navbar";

export default function DeletePastEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchPastEvents() {
      const now = new Date();
      const q = query(
        collection(db, "events"),
        where("eventDate", "<", now),
        orderBy("eventDate")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(data);
      setLoading(false);
    }
    fetchPastEvents();
  }, []);

  const handleDeleteOne = async (id, flyerURL) => {
    try {
      await deleteDoc(doc(db, "events", id));
      if (flyerURL) {
        const fileRef = ref(storage, flyerURL);
        await deleteObject(fileRef);
      }
      setEvents(prev => prev.filter(e => e.id !== id));
      setMessage("🗑️ Event deleted");
    } catch (err) {
      console.error("Failed to delete:", err);
      setMessage("❌ Failed to delete event");
    }
  };

  const handleDeleteAll = async () => {
    try {
      for (const event of events) {
        await deleteDoc(doc(db, "events", event.id));
        if (event.eventFlyerURL) {
          const fileRef = ref(storage, event.eventFlyerURL);
          await deleteObject(fileRef);
        }
      }
      setEvents([]);
      setMessage("🧹 All past events deleted");
    } catch (err) {
      console.error("Failed to delete all:", err);
      setMessage("❌ Failed to delete all past events");
    }
  };

  return (
    <>
      <Navbar />
      <div className="p-6 text-doomGreen max-w-screen-xl mx-auto">
        <h1 className="text-5xl font-metal text-doomGrey mb-6 text-center">Delete Past Events</h1>
        {message && <p className="text-center mb-4">{message}</p>}
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : events.length === 0 ? (
          <p className="text-center text-gray-500">No past events to delete.</p>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <button
                onClick={handleDeleteAll}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Delete All Past Events
              </button>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {events.map(event => (
                <div key={event.id} className="bg-black p-4 rounded-lg border border-doomGreen">
                  {event.eventFlyerURL && (
                    <img
                      src={event.eventFlyerURL}
                      alt="flyer"
                      className="w-full rounded mb-2"
                    />
                  )}
                  <h2 className="text-xl font-bold text-doomGreen mb-1">{event.eventName}</h2>
                  <p className="text-sm mb-1">{event.eventVenue}, {event.eventCity}</p>
                  <p className="text-sm mb-1">
                    {new Date(event.eventDate.seconds * 1000).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "short",
                      day: "numeric"
                    })}
                  </p>
                  <button
                    onClick={() => handleDeleteOne(event.id, event.eventFlyerURL)}
                    className="text-red-400 border border-red-400 px-3 py-1 rounded hover:bg-red-400 hover:text-black mt-2"
                  >
                    🗑️ Delete
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
