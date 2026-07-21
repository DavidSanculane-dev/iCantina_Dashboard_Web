import { getSession } from "@/lib/session";
import { getMealLogsCreatedAfter } from "@/lib/queries";

export const dynamic = "force-dynamic";

const POLL_INTERVAL_MS = 4000;

export async function GET() {
  const session = await getSession();
  if (!session) {
    return new Response("Nao autenticado", { status: 401 });
  }

  const clientId = session.clientId;
  const encoder = new TextEncoder();
  let lastSeen = new Date().toISOString();
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, payload: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`)
        );
      };

      const tick = async () => {
        if (closed) return;
        try {
          const novos = await getMealLogsCreatedAfter(clientId, lastSeen);
          if (novos.length > 0) {
            lastSeen = novos[novos.length - 1].created_at;
            send("meal-log", novos);
          } else {
            send("ping", { at: new Date().toISOString() });
          }
        } catch (err) {
          send("error", { message: "Falha ao consultar refeicoes" });
        }
      };

      const interval = setInterval(tick, POLL_INTERVAL_MS);
      tick();

      // @ts-expect-error - anexar para limpeza no cancel()
      controller._interval = interval;
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
