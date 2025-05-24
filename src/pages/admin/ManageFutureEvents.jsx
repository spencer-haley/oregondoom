import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../../firebase";
import Navbar from "../../components/Navbar";

export default function ManageFutureEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchEvents() {
      const today = new Date();
      const q = query(
        collection(db, "events"),
        where("approvalStatus", "==", true),
        where("eventDate", ">=", today),
        orderBy("eventDate")
      );
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(fetched);
      setLoading(false);
    }
    fetchEvents();
  }, []);

  const handleChange = (id, field, value) => {
    setEvents(prev =>
      prev.map(event => {
        if (event.id !== id) return event;
        const updated = { ...event };
        updated[field] = field === "eventDate" ? value.toString() : value;
        return updated;
      })
    );
  };

  const handleSave = async (event) => {
    try {
      let dateToSave;
      if (typeof event.eventDate === 'string') {
        const [dateStr, timeStr] = event.eventDate.split("T");
        const [year, month, day] = dateStr.split("-").map(Number);
        const [hour, minute] = timeStr.split(":").map(Number);
        dateToSave = new Date(year, month - 1, day, hour, minute);
      } else {
        dateToSave = new Date(event.eventDate.seconds * 1000);
      }

      await updateDoc(doc(db, "events", event.id), {
        ...event,
        eventDate: Timestamp.fromDate(dateToSave),
      });
      setMessage("✅ Saved changes");
    } catch (err) {
      console.error("Failed to update:", err);
      setMessage("❌ Failed to save changes");
    }
  };

  const handleDelete = async (id, flyerURL) => {
    try {
      await deleteDoc(doc(db, "events", id));
      if (flyerURL) {
        const fileRef = ref(storage, flyerURL);
        await deleteObject(fileRef);
      }
      setEvents(prev => prev.filter(e => e.id !== id));
      setMessage("🗑️ Deleted event");
    } catch (err) {
      console.error("Failed to delete:", err);
      setMessage("❌ Failed to delete event");
    }
  };

  const handleFlyerChange = async (e, event) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const oldRef = ref(storage, event.eventFlyerURL);
      if (event.eventFlyerURL) await deleteObject(oldRef);

      const newRef = ref(storage, `flyers/${Date.now()}_${file.name}`);
      await uploadBytes(newRef, file);
      const newURL = await getDownloadURL(newRef);

      await updateDoc(doc(db, "events", event.id), { eventFlyerURL: newURL });
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, eventFlyerURL: newURL } : e));
      setMessage("📸 Flyer updated");
    } catch (err) {
      console.error("Flyer update error:", err);
      setMessage("❌ Failed to update flyer");
    }
  };

  return (
    <>
      <Navbar />
      <div className="p-6 text-doomGreen max-w-screen-xl mx-auto">
        <h1 className="text-5xl font-metal text-doomGrey mb-6 text-center">Manage Future Events</h1>
        {message && <p className="text-center mb-4">{message}</p>}
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {events.map(event => (
              <div key={event.id} className="bg-black p-4 rounded-lg border border-doomGreen space-y-2">
                {event.eventFlyerURL && (
                  <img src={event.eventFlyerURL} alt="flyer" className="w-full rounded" />
                )}
                <input
                  className="w-full bg-black border border-doomGreen p-1 rounded"
                  value={event.eventName}
                  onChange={e => handleChange(event.id, "eventName", e.target.value)}
                />
                <input
                  type="datetime-local"
                  className="w-full bg-black border border-doomGreen p-1 rounded"
                  value={(() => {
                    const d = new Date(event.eventDate.seconds * 1000);
                    const offset = d.getTimezoneOffset();
                    const local = new Date(d.getTime() - offset * 60000);
                    return local.toISOString().slice(0, 16);
                  })()}
                  onChange={e => handleChange(event.id, "eventDate", e.target.value)}
                />
                <input
                  className="w-full bg-black border border-doomGreen p-1 rounded"
                  value={event.eventVenue}
                  onChange={e => handleChange(event.id, "eventVenue", e.target.value)}
                />
                <input
                  className="w-full bg-black border border-doomGreen p-1 rounded"
                  value={event.eventCity}
                  onChange={e => handleChange(event.id, "eventCity", e.target.value)}
                />
                <input
                  className="w-full bg-black border border-doomGreen p-1 rounded"
                  value={event.eventState}
                  onChange={e => handleChange(event.id, "eventState", e.target.value)}
                />
                <input
                  className="w-full bg-black border border-doomGreen p-1 rounded"
                  value={event.eventTicketsURL || ""}
                  onChange={e => handleChange(event.id, "eventTicketsURL", e.target.value)}
                />
                <textarea
                  className="w-full bg-black border border-doomGreen p-1 rounded"
                  value={event.eventNotes || ""}
                  onChange={e => handleChange(event.id, "eventNotes", e.target.value)}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handleFlyerChange(e, event)}
                  className="w-full bg-black border border-doomGreen p-1 rounded"
                />
                <div className="flex justify-between mt-2">
                  <button onClick={() => handleSave(event)} className="bg-doomGreen text-black px-3 py-1 rounded">💾 Save</button>
                  <button onClick={() => handleDelete(event.id, event.eventFlyerURL)} className="text-red-400 border border-red-400 px-3 py-1 rounded hover:bg-red-400 hover:text-black">🗑️ Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
