import Navbar from '../components/Navbar';

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <div className="p-6 max-w-3xl mx-auto text-doomGreen">
        <h1 className="text-6xl font-metal text-doomGrey mb-4">About Oregon Doom</h1>

        <p className="mb-4">
          Welcome to <strong>Oregon Doom</strong>, a dedicated platform for fans of doom and adjacent genres in the beautiful state of Oregon. Run by a passionate enthusiast, this site aims to be a focused resource for the Oregon community, showcasing the rich, dark tapestry of our slow, heavy music scene.
        </p>

        <h2 className="text-2xl text-doomGreen font-bold mb-2">Mission</h2>
        <p className="mb-4">
          We&rsquo;re not just curating events&mdash;we&rsquo;re building a spot where fans of all doom flavors can check in and hit the shows that keep the scene thriving. We&rsquo;re here to help amplify every riff, get one more ticket sold, and celebrate every bone-rattling moment that makes doom in Oregon unstoppable.
        </p>

        <p className="mb-4">
          We try our best to keep the site current and comprehensive, ensuring that no Oregon-based doom show, artist, or event is missed. But we are fallible humans, all in all. If you want to add a show, please reach out to <a href="https://instagram.com/oregondoom" target="_blank" rel="noopener noreferrer" className="underline text-doomGreen">@oregondoom on Instagram</a>.
        </p>

        <p className="mb-4">
          Doom&rsquo;s true essence is its ability to offer a personal, profound auditory journey that defies strict genre boundaries. Sometimes the best way to enjoy this music is to embrace its diversity and find what resonates with you. So, in the spirit of the backpacking community&rsquo;s mantra "Hike your own hike," we say,
          <p className="text-xl font-metal text-doomGrey mt-6">Doom your own doom.</p>
        </p>

        <p className="mb-4">
          All events and images are posted with the assumption of fair use.
        </p>
        <p className="mb-4">
          If this is not the case, please contact us, and we&rsquo;ll address it promptly.
        </p>
        <p className="mb-4">
          This is a community-driven project, so we encourage everyone to verify event details before attending.
        </p>

        <h2 className="text-2xl text-doomGreen font-bold mt-10 mb-2">Open Source & Community Roots</h2>
        <p className="mb-4">
          Oregon Doom is open source. All code, data structure, and deployment setup are publicly available here:
          <br />
          <a href="https://github.com/spencer-haley/oregondoom" target="_blank" rel="noopener noreferrer" className="underline text-doomGreen">
            github.com/spencer-haley/oregondoom
          </a>
        </p>

        <h2 className="text-2xl text-doomGreen font-bold mt-10 mb-2">Scene Resources & Doom Companions</h2>

        <h3 className="text-xl font-bold text-doomGrey mt-6 mb-2">Doom Journalism & Discovery Platforms</h3>
        <ul className="list-disc list-inside mb-4 space-y-1">
          <li><a href="https://doomcharts.com/" className="underline">Doom Charts</a></li>
          <li><a href="https://doomedandstoned.com/" className="underline">Doomed & Stoned</a></li>
          <li><a href="https://cleanandsoberstoner.blogspot.com/" className="underline">Clean and Sober Stoner</a></li>
          <li><a href="https://www.angrymetalguy.com/" className="underline">Angry Metal Guy</a></li>
          <li><a href="https://www.thesleepingshaman.com/" className="underline">The Sleeping Shaman</a></li>
          <li><a href="https://www.nocleansinging.com/" className="underline">No Clean Singing</a></li>
          <li><a href="https://outlawsofthesun.blogspot.com/" className="underline">Outlaws of the Sun</a></li>
          <li><a href="https://doesitdoom.com/" className="underline">Does It Doom?</a></li>
          <li><a href="https://www.doom-metal.com/" className="underline">Doom-Metal.com</a></li>
          <li><a href="https://www.metal-archives.com/" className="underline">Encyclopaedia Metallum</a></li>
          <li><a href="https://theheavychronicles.com/" className="underline">The Heavy Chronicles</a></li>
          <li><a href="https://weedian420.bandcamp.com/" className="underline">Weedian</a></li>

        </ul>

        <h3 className="text-xl font-bold text-doomGrey mt-6 mb-2">Pacific Northwest Doom Hubs</h3>
        <ul className="list-disc list-inside mb-4 space-y-1">
          <li><a href="https://www.facebook.com/groups/576558172374944/" className="underline">Portland Doom, Sludge, and Stoner (Facebook)</a></li>
          <li><a href="https://www.facebook.com/groups/101240599958715/" className="underline">Eugene Metal (Facebook)</a></li>
          <li><a href="https://www.portlandmercury.com/music" className="underline">Portland Mercury – Music Listings</a></li>
          <li><a href="https://www.facebook.com/people/Posers-Must-Die-Heavy-Metal-YouTube-Show/61558159600282/" className="underline">Posers Must Die (Facebook)</a></li>
          <li><a href="https://www.wweek.com/music/" className="underline">Willamette Week</a></li>
        </ul>

        <h3 className="text-xl font-bold text-doomGrey mt-6 mb-2">Booking & Promotion Collectives</h3>
        <ul className="list-disc list-inside mb-4 space-y-1">
          <li><a href="https://www.nanotear.com/" className="underline">Nanotear</a></li>
          <li><a href="https://linktr.ee/flosslesspresents" className="underline">Flossless Presents</a></li>
          <li><a href="https://www.instagram.com/glasspyrebooking/" className="underline">Glass Pyre Booking (Instagram)</a></li>
          <li><a href="https://www.facebook.com/redcrowbooking/" className="underline">Red Crow Booking (Facebook)</a></li>
        </ul>

      </div>
    </>
  );
}
