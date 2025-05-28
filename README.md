# Oregon Doom

A one-stop online hub for Oregon’s doom metal scene – featuring upcoming event listings, local music releases, a historical show archive, and an interactive network of the bands that shape the community.

## Description

**Oregon Doom** is a web platform dedicated to Oregon’s doom metal music community. The site brings together all facets of the scene in one place, enabling fans to discover upcoming concerts, explore recent music releases, delve into a historical archive of past shows, and interact with an ecosystem graph of band connections. The goal of the project is to support and amplify the local doom scene – helping fans find shows and music easily, and giving artists and organizers a greater platform for visibility.

### Key Features

* **Events:** Browse a list of upcoming doom and doom-adjacent shows across Oregon. Each event entry includes the date, venue, city, lineup, and links for more info (e.g. tickets). You can filter events by city or view all by default.
* **Releases:** Discover recent releases from Oregon doom bands. Each entry shows the artist, title, location, format (LP, EP, etc.), release date, and often an embedded Bandcamp player so you can listen to a track or two. You can search by artist or title, filter by release year, and highlight releases that were featured in the global “Doom Charts”.
* **Archive:** Explore a searchable archive of past shows dating back to 2000. This archive includes thousands of event records – use filters (band name, year, city, venue) or free-text search to find specific shows. You can also toggle summary statistics (total events, unique bands, top venues, etc.) to get insights into the scene’s history. For offline analysis or personal keeping, you can download the entire archive as a CSV file with one click.
* **Ecosystem:** Visualize the network of bands in the Oregon doom scene through an interactive graph. Bands are nodes, and links between them indicate they’ve played a show together. You can zoom/pan around the network and even focus on a specific band to see all its connections and the shared shows that link them.
* **About:** Learn more about the project’s mission and background on the About page. Oregon Doom is a community-driven, open-source project built by a local enthusiast, and the About section explains its purpose and ethos. It also provides info on how to get in touch (for submitting events or feedback).
* **Admin Interface:** Oregon Doom includes an Admin Interface (hidden from public view) for maintainers to manage the content. Authorized admins can log in to add new events (with flyer image uploads), add new releases (with embed codes), edit or remove events, and generally keep the data up-to-date. This interface is secured by Firebase Authentication (email/password) and not accessible to general users.

## Technology Stack

Oregon Doom is built with a modern web stack for a fast and maintainable experience:

### Front-End

* **React + Vite** – a reactive single-page application for dynamic UI, bundled with Vite for efficient development and build. The app uses React Router for client-side routing between sections.
* **Tailwind CSS** – a utility-first CSS framework for rapid UI development. The site’s design features a dark theme (black background, neon green and gray accent colors) reflecting a doom metal aesthetic.

### Data & Backend (Firebase)

* **Cloud Firestore** – a NoSQL database storing all event listings, release info, and archival data. The React app queries Firestore to read the latest content. Firestore rules ensure only admins can write data.
* **Firebase Storage** – stores media assets like event flyer images and static files (e.g., the archive CSV). Images are uploaded by admins and delivered via Storage URLs.
* **Firebase Authentication** – handles user login for the admin interface (using secure email/password auth). Only authorized accounts can access content management features.

### Visualization

* **D3.js** – a JavaScript library for data visualization, used to render the interactive SVG network graph on the Ecosystem page.

### Utilities/Libraries

* **React Icons** provides icon components for UI elements (for consistency with the theme).
* **Papa Parse** is used on the client side to parse CSV data (for importing the large archive of shows into the app state).
* **Firebase SDK** for JavaScript connects the app to Firestore/Storage/Auth.
* **ESLint** is used during development to ensure code quality (with recommended React/JS rules).

### Analytics

* **Google Analytics 4** is integrated to track page views and user interactions (using a GA Measurement ID).

### Deployment

* The site is deployed on **Firebase Hosting**. The app is built into static files (HTML/CSS/JS) and served over Firebase’s CDN. All client-side routes are handled via a single-page app fallback.

## Installation & Setup

### Prerequisites

* Node.js (v16 or newer recommended) and npm (or Yarn)
* A Firebase Project set up with Firestore, Storage, and Authentication
* (Optional) Bandcamp embed codes for any music releases you plan to add

### Installation

```bash
git clone https://github.com/spencer-haley/oregondoom.git
cd oregondoom
npm install
```

### Environment Variables

Create a `.env` file with the following:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_GA_MEASUREMENT_ID=...
```

### Run the Dev Server

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173).

### Populate Data

* Use the `/login` route to access the Admin UI and add events/releases
* Or populate Firestore manually via Firebase Console
* Archive data can be uploaded via Storage or imported via script: `scripts/import-shows-from-csv.cjs`

### Build for Production

```bash
npm run build
```

### Deploy

```bash
firebase deploy
```

## Usage

* **Events:** View and filter upcoming events
* **Releases:** Discover music, search, and filter
* **Archive:** Search and filter past shows, download CSV
* **Ecosystem:** Explore band connections via network graph
* **About:** Project background and contact
* **Admin:** Log in, add/edit/delete content (events, releases, archive)

## Contributing

We welcome contributions. Guidelines:

* Use Issues to report bugs or suggest features
* Fork, branch, and PR for changes
* Run `npm run lint` before submitting
* Focus on Oregon doom or adjacent genres
* Credit original repo if forking to another scene

## License

MIT License. Use, modify, and distribute freely. Shout-outs appreciated. 🤘
