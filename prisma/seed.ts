import { PrismaClient } from "@prisma/client";
import { Pbkdf2PasswordHasher } from "../lib/auth/passwords";
import { films } from "../server/demo/catalog";
const db=new PrismaClient();
const primaryGenres=["Action","Adventure","Animation","Comedy","Crime","Documentary","Drama","Family","Fantasy","Historical","Horror","Mystery","Romance","Science Fiction","Thriller","War","Western","Musical","Music and Performance","Biography","Sports","Experimental and Arthouse","Short Films"];
const storyThemes=["Betrayal","Family Conflict","Redemption","Coming of Age","Survival","Political Corruption","Social Justice","Identity and Belonging","Friendship","Revenge","Mystery and Investigation","Faith and Spirituality","Historical Conflict","Love and Relationships","Psychological Drama"];
const slug=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
async function main(){
 if(process.env.NODE_ENV==="production"&&process.env.DEMO_MODE==="true")throw new Error("Demo seed is disabled in production");
 const plans=[{code:"STUDENT",name:"ORUN Student",priceAmount:BigInt(20000),maxQuality:480,maxProfiles:1,maxStreams:1,downloadsEnabled:false},{code:"ESSENTIAL",name:"ORUN Essential",priceAmount:BigInt(35000),maxQuality:720,maxProfiles:2,maxStreams:1,downloadsEnabled:true},{code:"PREMIUM",name:"ORUN Premium",priceAmount:BigInt(50000),maxQuality:1080,maxProfiles:4,maxStreams:2,downloadsEnabled:true},{code:"BLACK",name:"ORUN Black",priceAmount:BigInt(70000),maxQuality:2160,maxProfiles:6,maxStreams:4,downloadsEnabled:true}];
 for(const plan of plans)await db.subscriptionPlan.upsert({where:{code:plan.code},update:plan,create:{...plan,currency:"KES",audioQuality:"HIGH",benefits:{earlyReleases:plan.code==="BLACK",exclusiveContent:true}}});
 const genreRows=new Map<string,string>(),themeRows=new Map<string,string>();
 for(const [index,name] of primaryGenres.entries()){const row=await db.genre.upsert({where:{slug:slug(name)},update:{name,active:true,sortOrder:index},create:{slug:slug(name),name,sortOrder:index}});genreRows.set(name,row.id)}
 for(const [index,name] of storyThemes.entries()){const row=await db.storyTheme.upsert({where:{slug:slug(name)},update:{name,active:true,sortOrder:index},create:{slug:slug(name),name,sortOrder:index}});themeRows.set(name,row.id)}
 const passwordHash=await new Pbkdf2PasswordHasher().hash("OrunDemo!2026");
 await db.user.upsert({where:{email:"viewer@orun.test"},update:{},create:{name:"Demo Viewer",email:"viewer@orun.test",passwordHash,status:"ACTIVE",emailVerifiedAt:new Date(),countryCode:"KE",profiles:{create:{name:"Viewer"}}}});
 const creator=await db.user.upsert({where:{email:"creator@orun.test"},update:{},create:{name:"B28 Creator",email:"creator@orun.test",passwordHash,status:"ACTIVE",emailVerifiedAt:new Date(),countryCode:"KE",profiles:{create:{name:"B28 Entertainment"}}}});
 for(const item of films){
  const film=await db.film.upsert({where:{slug:item.slug},update:{contentFormat:item.contentFormat.toUpperCase().replaceAll(" ","_"),region:item.region,dubbedLanguages:item.audioLanguages,subtitleLanguages:item.subtitleLanguages,videoQualities:item.videoQualities,popularityScore:item.popularity,trending:item.trending??false,featured:item.featured??false},create:{slug:item.slug,title:item.title,description:item.synopsis,year:item.year,runtimeMinutes:item.runtime,countryCode:"KE",originalLanguage:"en",status:"PUBLISHED",access:item.access==="Free"?"FREE":"PREMIUM",isOriginal:item.isOriginal??false,isShort:item.runtime>0&&item.runtime<40,contentFormat:item.contentFormat.toUpperCase().replaceAll(" ","_"),region:item.region,dubbedLanguages:item.audioLanguages,subtitleLanguages:item.subtitleLanguages,videoQualities:item.videoQualities,popularityScore:item.popularity,trending:item.trending??false,featured:item.featured??false,publishedAt:new Date()}});
  await db.filmCreatorRecipient.upsert({where:{filmId:film.id},update:{userId:creator.id},create:{filmId:film.id,userId:creator.id}});
  await db.filmGenre.deleteMany({where:{filmId:film.id}});for(const name of item.genres){const id=genreRows.get(name);if(id)await db.filmGenre.create({data:{filmId:film.id,genreId:id}})}
  await db.filmStoryTheme.deleteMany({where:{filmId:film.id}});for(const name of item.themes){const id=themeRows.get(name);if(id)await db.filmStoryTheme.create({data:{filmId:film.id,themeId:id}})}
 }
}
main().finally(()=>db.$disconnect());
