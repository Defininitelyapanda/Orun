import { notFound } from "next/navigation";
import { WatchExperience } from "@/components/player/watch-experience";
import { recommendFilms } from "@/lib/recommendations/recommendation-engine";
import { films } from "@/server/demo/catalog";
export default async function WatchPage({params}:{params:Promise<{id:string}>}){
 const{id}=await params;const film=films.find(item=>item.id===id);if(!film)notFound();
 const recommendations=recommendFilms(film,films,5).map(item=>item.film);
 const genres=[...new Set(films.flatMap(item=>item.genres))].sort();
 const categories=[{label:"Films",href:"/discover"},{label:"Series",href:"/series"},{label:"Short Films",href:"/discover?format=Short+Films"},{label:"Kenyan Cinema",href:"/discover?region=Kenya"},{label:"New Releases",href:"/discover?sort=recently-added"},{label:"Trending",href:"/discover?sort=trending"},{label:"Top Rated",href:"/discover?sort=highest-rated"},...genres.map(genre=>({label:genre,href:`/discover?genre=${encodeURIComponent(genre)}`}))];
 return <WatchExperience film={film} recommendations={recommendations} categories={categories}/>;
}
