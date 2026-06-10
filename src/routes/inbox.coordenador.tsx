import { createFileRoute } from "@tanstack/react-router";
import { InboxView } from "@/components/inbox-view";

export const Route = createFileRoute("/inbox/coordenador")({
  head: () => ({
    meta: [
      { title: "Fila de Pendências — Coordenação" },
      { name: "description", content: "Coordenação acadêmica: apenas processos pendentes aguardando análise." },
    ],
  }),
  component: () => (
    <InboxView
      title="Fila de Pendências"
      description="Apenas contratos aguardando sua análise."
      onlyContratoStatus={["Pendente"]}
    />
  ),
});
