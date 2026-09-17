import { Metadata } from "next";
import { Link as LinkIcon, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { CONTENT_LAST_UPDATED_EN } from '@/lib/site-constants';
import { generateAlternates } from '@/lib/utils';

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Our Partners and Featured Resources",
    description: "Discover websites and resources that have featured our brain training games and cognitive development tools.",
    keywords: ["partnerships", "backlinks", "featured resources", "collaborations", "brain training resources"],
    openGraph: {
      title: "Our Partners and Resources | FreeFocusGames",
      description: "See where our brain training games have been featured across the web.",
      type: "website",
    },
    alternates: generateAlternates(locale, 'partnerships'),
  }
}

interface BacklinkProps {
  title: string;
  url: string;
  description: string;
  category: string;
  date: string;
}

const backlinkData: BacklinkProps[] = [
  {
    title: "FreeFocus Tistory Blog",
    url: "https://freefocus.tistory.com/",
    description: "Korean blog post discussing free memory and concentration training games.",
    category: "Blog",
    date: "2025-04-07"
  },
  {
    title: "FreeFocusGames on Tumblr",
    url: "https://www.tumblr.com/freefocusgames/780136014200078336/free-focus-memory-games-train-your-brain?source=share",
    description: "Tumblr post sharing the FreeFocusGames website for brain training exercises.",
    category: "Social Media",
    date: "2025-04-06" // Assuming a recent date as none is obvious
  },
  {
    title: "Reclaiming Your Focus (Blogspot)",
    url: "https://freefocusgames.blogspot.com/2025/03/dualnback.html",
    description: "Exploring challenges to focus in the digital age and discussing Dual N-Back brain training.",
    category: "Blog",
    date: "2025-03-18"
  },
  {
    title: "Schedule a Meeting (Cal.com)",
    url: "https://cal.com/j-s-xpmucb",
    description: "Book a 15-minute or 30-minute meeting with J S from FreeFocusGames.",
    category: "Contact",
    date: "2024-07-23" // Set to current date
  }
];

function Backlink({ title, url, description, category, date }: BacklinkProps) {
  return (
    <div className="border rounded-lg p-5 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold flex items-center">
          <ExternalLink className="w-4 h-4 mr-2 flex-shrink-0" />
          <Link href={url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
            {title}
          </Link>
        </h3>
        <span className="text-sm text-gray-500">{date}</span>
      </div>
      <p className="text-gray-700 mb-3">{description}</p>
      <div className="flex justify-between items-center">
        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
          {category}
        </span>
        <Link href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
          Visit Website →
        </Link>
      </div>
    </div>
  );
}

export default function PartnershipsPage() {
  // Group backlinks by category
  const categories = [...new Set(backlinkData.map(item => item.category))];
  
  return (
    <div className="container max-w-4xl mx-auto py-10 px-4">
      <div className="flex items-center justify-center mb-10">
        <LinkIcon className="w-8 h-8 mr-2 text-blue-600" />
        <h1 className="text-3xl font-bold text-center">Our Partners & Featured Resources</h1>
      </div>
      
      <div className="mb-8">
        <p className="text-lg mb-4">
          We are proud to be featured on these reputable websites that recognize the value of our brain training games and cognitive development tools. These partnerships help us reach more users and continue our mission of providing free, accessible brain training for everyone.
        </p>
      </div>
      
      {categories.map(category => (
        <div key={category} className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b">{category} Resources</h2>
          <div className="grid gap-5 md:grid-cols-2">
            {backlinkData
              .filter(item => item.category === category)
              .map((item, index) => (
                <Backlink key={index} {...item} />
              ))
            }
          </div>
        </div>
      ))}
      
      <div className="mt-10 p-5 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">About Our Backlinks</h2>
        <p>
          This page was last updated on {CONTENT_LAST_UPDATED_EN}. 
          We regularly update this list to include new resources and partnerships. The links above represent websites that have 
          featured our content or services. We appreciate their support in helping us reach a wider audience.
        </p>
      </div>
    </div>
  );
} 
