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


      </div>
    </>
  );
}
