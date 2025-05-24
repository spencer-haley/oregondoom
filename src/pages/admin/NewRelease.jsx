import { useState } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../../firebase";
import Navbar from "../../components/Navbar";

export default function NewRelease() {
  const [form, setForm] = useState({
    artist: "",
    title: "",
    location: "",
    format: "",
    embed: "",
    date: "",
    doomchart: false,
    tags: [""]
  });
  const [message, setMessage] = useState("");

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const generateUserSearch = () => {
    const tokens = new Set();
    const tokenize = str => str.toLowerCase().split(/\s+/);
    const combined = `${form.artist} ${form.location} ${form.title}`.toLowerCase();

    tokenize(form.artist).forEach(t => tokens.add(t));
    tokenize(form.location).forEach(t => tokens.add(t));
    tokenize(form.title).forEach(t => tokens.add(t));
    tokens.add(combined);

    return Array.from(tokens);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const dateObj = new Date(form.date);
      if (isNaN(dateObj)) throw new Error("Invalid date format");

      const year = dateObj.getFullYear();
      const usersearch = generateUserSearch();

      const docRef = await addDoc(collection(db, "releases_v2"), {
        artist: form.artist,
        title: form.title,
        location: form.location,
        format: form.format,
        embed: form.embed,
        date: Timestamp.fromDate(dateObj),
        doomchart: form.doomchart,
        tags: form.tags.filter(Boolean),
        usersearch,
        year
      });

      setForm({
        artist: "",
        title: "",
        location: "",
        format: "",
        embed: "",
        date: "",
        doomchart: false,
        tags: [""]
      });
      setMessage("✅ Release added successfully");
    } catch (err) {
      console.error("Error adding release:", err);
      setMessage("❌ Failed to add release");
    }
  };

  return (
    <>
      <Navbar />
      <div className="p-6 text-doomGreen max-w-screen-md mx-auto">
        <h1 className="text-5xl font-metal text-doomGrey mb-6 text-center">Create New Release</h1>
        {message && <p className="text-center mb-4">{message}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Artist" value={form.artist} onChange={e => handleChange("artist", e.target.value)} className="w-full bg-black border border-doomGreen p-2 rounded" required />
          <input type="text" placeholder="Title" value={form.title} onChange={e => handleChange("title", e.target.value)} className="w-full bg-black border border-doomGreen p-2 rounded" required />
          <input type="text" placeholder="Location" value={form.location} onChange={e => handleChange("location", e.target.value)} className="w-full bg-black border border-doomGreen p-2 rounded" required />
          <input type="text" placeholder="Format (e.g. LP, EP, CD)" value={form.format} onChange={e => handleChange("format", e.target.value)} className="w-full bg-black border border-doomGreen p-2 rounded" required />
          <input type="text" placeholder="Bandcamp Embed Code" value={form.embed} onChange={e => handleChange("embed", e.target.value)} className="w-full bg-black border border-doomGreen p-2 rounded" required />
          <input type="date" value={form.date} onChange={e => handleChange("date", e.target.value)} className="w-full bg-black border border-doomGreen p-2 rounded" required />
          <label className="flex items-center space-x-2">
            <input type="checkbox" checked={form.doomchart} onChange={e => handleChange("doomchart", e.target.checked)} />
            <span>Doomchart?</span>
          </label>
          <textarea placeholder="Tags (comma-separated)" value={form.tags.join(", ")} onChange={e => handleChange("tags", e.target.value.split(",").map(tag => tag.trim()))} className="w-full bg-black border border-doomGreen p-2 rounded" />
          <button type="submit" className="bg-doomGreen text-black px-4 py-2 rounded">➕ Submit Release</button>
        </form>
      </div>
    </>
  );
}
