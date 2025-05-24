# Oregon Doom

## Description

**Oregon Doom** is a web platform dedicated to Oregon’s doom music scene. It provides a one-stop hub for fans of doom and related genres to discover upcoming concerts, explore local music releases, and dive into the history and connections of bands in Oregon. The site is a single-page application (SPA) that presents:

- **Events:** A listing of upcoming doom and doom-adjacent shows across Oregon, with filters by city.  
- **Releases:** A curated directory of music releases from Oregon bands, including search and highlight of releases featured in Doom Charts.  
- **Archive:** A historical archive of past shows (2000–present) with search and filter options, plus some interesting stats and the ability to download the archive data as CSV.  
- **Ecosystem:** An interactive network graph visualizing connections between bands (who has shared the stage with whom) in the Oregon doom scene.  
- **About:** Background on the project and its mission in supporting the community.

Oregon Doom is built and maintained by a passionate enthusiast of the local doom scene. The goal is to **amplify the community** – helping fans find shows and music, and helping artists get more visibility.

## Features

- **Upcoming Events:** Browse upcoming shows with date, venue, city, and lineup info. Filter events by city or view all. Each event may include a flyer image and a link to tickets (if available).  
- **Music Releases:** Discover recent releases from Oregon doom bands. Entries show artist, title, location, format, release date, and often include an embedded Bandcamp player for previewing music. Filter by year, search by artist/title, and optionally highlight releases that made it onto the global “Doom Charts.”  
- **Historical Archive:** Explore a chronologically ordered list of past events spanning decades. Search by band name, filter by year, city, or venue to find specific shows. Toggle summary statistics (total events, unique bands, etc., plus top 25 bands, cities, venues, and a breakdown of number of shows per year). Data can be downloaded for offline analysis.  
- **Band Ecosystem Graph:** Visualize the network of bands based on shared shows. Each node is a band (with size reflecting number of appearances) and links connect bands that have played together. You can zoom/pan the graph and focus on a particular band to see its connections and the shows linking them.  
- **Admin Interface:** (For maintainers) Secure login for site admins to add new events or releases, and manage existing data. Admins can create events (with image upload for flyers), remove past events in bulk, edit upcoming events (e.g., change details or update the flyer), and add or update releases. This interface is protected by Firebase Authentication and not visible to general users.

## Technology Stack

- **Frontend:** React + Vite for a fast, modular single-page application. React Router is used for client-side routing between sections.  
- **Styling:** Tailwind CSS for rapid, responsive UI design. The site uses a custom dark theme (black background, neon green accents, etc.) to match the doom metal aesthetic.  
- **Data & Auth:** Firebase is used as the backend:
  - Firestore – stores events and releases data (NoSQL database).  
  - Firebase Storage – hosts images (event flyers) and static assets (like the archive CSV).  
  - Firebase Authentication – secures the admin login (email/password).  
- **Visualization:** D3.js powers the interactive SVG graph on the Ecosystem page.  
- **Utilities:** Libraries like `react-icons` for icons and `papaparse` for CSV parsing are used.

This stack ensures the site is lightweight and **fast** (thanks to Vite and static hosting) while being easy to update by the admin without needing direct database edits.

## Prerequisites

If you want to run Oregon Doom locally or deploy your own instance, you’ll need the following:

- **Node.js** (version 16 or above recommended) and npm (or Yarn) installed on your development machine.  
- **Firebase account** – you should have a Firebase project set up with Firestore, Firebase Storage, and Firebase Authentication (email/password sign-in enabled). This is required if you plan to use the data management features.  
- **Firebase configuration** – the project expects Firebase config variables (API keys, etc.). You will need to provide these in the environment (see Installation below).  
- **Bandcamp embed codes** (optional) – if you plan to populate the Releases section, having Bandcamp album embed codes for the releases is useful so that the music players display.

## Installation

1. **Clone the repository**:  
   ```bash
   git clone https://github.com/spencer-haley/oregondoom.git 
   cd oregondoom
   ```
2. **Install dependencies**:  
   ```bash
   npm install
   ```  

3. **Set up environment variables**:  
   Create a file named `.env` in the project root:
   ```bash
   VITE_FIREBASE_API_KEY=<your_api_key>
   VITE_FIREBASE_AUTH_DOMAIN=<your_project>.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=<your_project_id>
   VITE_FIREBASE_STORAGE_BUCKET=<your_project>.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=<your_sender_id>
   VITE_FIREBASE_APP_ID=<your_app_id>
   ```

4. **Run the development server**:  
   ```bash
   npm run dev
   ```

5. **(Optional) Populate data** via admin UI or Firebase Console:
   - *Events*: documents with fields like `eventName`, `eventDate` (Timestamp), etc.
   - *Releases*: documents with fields like `artist`, `title`, `location`, `date` (Timestamp), etc.

6. **Build for production**:  
   ```bash
   npm run build
   ```

## Usage

Navigate through `/events`, `/releases`, `/archive`, `/ecosystem`, and `/about`. Admin features are available at `/login`.

## License

This project is licensed under the **MIT License**.

*Oregon Doom is an open-source effort in spirit – contributions or forks are welcome to adapt it for other music communities. If you do use this code, a shout-out to the original project would be appreciated!*