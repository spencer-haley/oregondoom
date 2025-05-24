import { useState } from "react";
import { db, storage } from "../../firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Navbar from "../../components/Navbar";

export default function NewEvents() {
  const [form, setForm] = useState({
    eventName: "",
    eventDate: new Date().toISOString().slice(0, 10) + "T20:00",
    eventVenue: "",
    eventCity: "",
    eventState: "Oregon",
    eventTicketsURL: "",
    eventNotes: "",
    eventFlyer: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setForm((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      let flyerURL = "";
      if (form.eventFlyer) {
        const flyerRef = ref(storage, `flyers/${Date.now()}_${form.eventFlyer.name}`);
        await uploadBytes(flyerRef, form.eventFlyer);
        flyerURL = await getDownloadURL(flyerRef);
      }

      await addDoc(collection(db, "events"), {
        eventName: form.eventName,
        eventDate: Timestamp.fromDate(new Date(form.eventDate)),
        eventVenue: form.eventVenue,
        eventCity: form.eventCity,
        eventState: form.eventState,
        eventTicketsURL: form.eventTicketsURL,
        eventNotes: form.eventNotes,
        eventFlyerURL: flyerURL,
        approvalStatus: true,
      });

      setMessage("✅ Event created successfully");
      setForm({
        eventName: "",
        eventDate: new Date().toISOString().slice(0, 10) + "T20:00",
        eventVenue: "",
        eventCity: "",
        eventState: "",
        eventTicketsURL: "",
        eventNotes: "",
        eventFlyer: null,
      });
    } catch (error) {
      console.error("Error adding event:", error);
      setMessage("❌ Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="p-6 text-doomGreen max-w-screen-md mx-auto">
        <h1 className="text-5xl font-metal text-doomGrey mb-6 text-center">Create New Event</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="eventName" value={form.eventName} onChange={handleChange} placeholder="Event name" className="w-full p-2 bg-black border border-doomGreen rounded" required />
          <input name="eventDate" type="datetime-local" value={form.eventDate} onChange={handleChange} className="w-full p-2 bg-black border border-doomGreen rounded" required />
          <input name="eventVenue" value={form.eventVenue} onChange={handleChange} placeholder="Venue" className="w-full p-2 bg-black border border-doomGreen rounded" required />
          <input name="eventCity" value={form.eventCity} onChange={handleChange} placeholder="City" className="w-full p-2 bg-black border border-doomGreen rounded" required />
          <input name="eventState" value={form.eventState} onChange={handleChange} placeholder="State" className="w-full p-2 bg-black border border-doomGreen rounded" required />
          <input name="eventTicketsURL" value={form.eventTicketsURL} onChange={handleChange} placeholder="Tickets URL" className="w-full p-2 bg-black border border-doomGreen rounded" />
          <textarea name="eventNotes" value={form.eventNotes} onChange={handleChange} placeholder="Notes" className="w-full p-2 bg-black border border-doomGreen rounded" />
          <input name="eventFlyer" type="file" accept="image/*" onChange={handleChange} className="w-full p-2 bg-black border border-doomGreen rounded" />
          <button type="submit" className="w-full bg-doomGreen text-black py-2 rounded" disabled={submitting}>
            {submitting ? "Creating..." : "Create Event"}
          </button>
          {message && <p className="text-center mt-4">{message}</p>}
        </form>
      </div>
    </>
  );
}
