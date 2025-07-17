import { Settings, Users, TrendingUp, Percent, ArrowUp, Clock, TriangleAlert } from "lucide-react";
import type { DashboardStats } from "@/types";

interface StatusCardsProps {
  stats: DashboardStats;
}

export default function StatusCards({ stats }: StatusCardsProps) {
  const cards = [
    {
      title: "Máquinas Ativas",
      value: stats.activeMachines,
      subtitle: "+2 hoje",
      icon: Settings,
      iconBg: "bg-success-50",
      iconColor: "text-success-600",
      subtitleColor: "text-success-600",
      subtitleIcon: ArrowUp,
    },
    {
      title: "Colaboradores Ativos", 
      value: stats.activeEmployees,
      subtitle: "Turno Manhã",
      icon: Users,
      iconBg: "bg-primary-50",
      iconColor: "text-primary-600",
      subtitleColor: "text-primary-600",
      subtitleIcon: Clock,
    },
    {
      title: "Produção Hoje",
      value: stats.todayProduction.toLocaleString(),
      subtitle: "87% da meta",
      icon: TrendingUp,
      iconBg: "bg-warning-50",
      iconColor: "text-warning-600",
      subtitleColor: "text-success-600",
    },
    {
      title: "Eficiência Geral",
      value: `${stats.overallEfficiency}%`,
      subtitle: "Abaixo da meta",
      icon: Percent,
      iconBg: "bg-error-50",
      iconColor: "text-error-600",
      subtitleColor: "text-warning-600",
      subtitleIcon: TriangleAlert,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{card.title}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
              <p className={`text-sm mt-1 flex items-center ${card.subtitleColor}`}>
                {card.subtitleIcon && <card.subtitleIcon className="w-4 h-4 mr-1" />}
                {card.subtitle}
              </p>
            </div>
            <div className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center`}>
              <card.icon className={`${card.iconColor} text-xl`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
