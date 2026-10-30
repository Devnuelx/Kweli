import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

const BLOG_POSTS = [
  {
    id: 1,
    category: "INSIGHT",
    title: "A complete guide to project success in 2026",
    image: "/usecase.avif",
    link: "/blog/project-success-2026",
    badgeColor: "bg-yellow-500",
  },
  {
    id: 2,
    category: "TOOLS",
    title: "Top 10 digital agency software",
    image: "/hero.png",
    link: "/blog/top-10-agency-software",
    badgeColor: "bg-blue-500",
  },
  {
    id: 3,
    category: "MANAGEMENT",
    title: "What Are Billable Hours",
    image: "/screen1.jpg",
    link: "/blog/what-are-billable-hours",
    badgeColor: "bg-green-500",
  }
];

export default function BlogSection() {
  return (
    <section className="py-24 bg-[#FDFDFD] border-t border-gray-100"  id="news">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
             <div className="text-[#754d29] font-bold font-funnel-display text-xs md:text-sm tracking-widest uppercase mb-4">
               RESOURCES & NEWS
             </div>
             <h2 className=" font-funnel-display text-4xl md:text-[3.5rem] font-bold text-[#1a1615] tracking-tight">
               Latest from the blog
             </h2>
          </div>
          <Link href="/blog" className="hidden md:flex items-center gap-2 font-semibold text-[#1a1615] hover:gap-3 transition-all">
            View all articles <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {BLOG_POSTS.map((post) => (
            <Link href={post.link} key={post.id} className="group block cursor-pointer">
              <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden mb-6 bg-gray-100">
                <Image 
                  src={post.image} 
                  alt={post.title} 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-105" 
                />
              </div>
              <div className="flex justify-between items-start gap-4">
                 <h3 className="text-xl md:text-2xl font-bold text-[#1a1615] leading-snug group-hover:text-blue-600 transition-colors">
                   {post.title}
                 </h3>
                 <span className={`text-[10px] font-bold text-white px-3 py-1 rounded-full uppercase tracking-wider ${post.badgeColor} shrink-0`}>
                   {post.category}
                 </span>
              </div>
            </Link>
          ))}
        </div>
        
        <Link href="/blog" className="mt-12 md:hidden flex justify-center items-center gap-2 font-semibold text-[#1a1615] border border-gray-200 py-3 rounded-full hover:bg-gray-50">
           View all articles <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
