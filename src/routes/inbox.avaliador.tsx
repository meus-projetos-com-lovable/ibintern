import { createFileRoute } from "@tanstack/react-router";
import { InboxView } from "@/components/inbox-view";

export const Route = createFileRoute("/inbox/avaliador")({
  head: () => ({
    meta: [
      { title: "Avaliação de Contratos — Secretaria" },
      { name: "description", content: "Painel da Secretaria com todos os processos de estágio e ações de validação." },
    ],
  }),
  component: () => (
    <InboxView
      title="Avaliação de Contratos"
      description="Acesso completo a todos os processos dos alunos da instituição."
      showStatusFilter
    />
  ),
});
