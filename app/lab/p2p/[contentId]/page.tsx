import { P2PLabPlayer } from "@/components/p2p/p2p-lab-player";
import { films } from "@/server/demo/catalog";

export const metadata = { title: "P2P Lab" };

export default async function P2PLabPage({ params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = await params;
  const title = films.find((film) => film.id === contentId)?.title ?? "Authorized experiment";
  return <P2PLabPlayer contentId={contentId} title={title}/>;
}
