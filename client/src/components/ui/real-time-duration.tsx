import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface RealTimeDurationProps {
  startTime: string;
  endTime?: string;
  status: string;
}

export default function RealTimeDuration({ startTime, endTime, status }: RealTimeDurationProps) {
  const [duration, setDuration] = useState("");
  const [startDateTime, setStartDateTime] = useState("");

  useEffect(() => {
    const start = new Date(startTime);
    
    // Format start date and time
    const formatDateTime = (date: Date) => {
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    };

    setStartDateTime(formatDateTime(start));

    const updateDuration = () => {
      const end = endTime ? new Date(endTime) : new Date();
      const diff = Math.max(0, end.getTime() - start.getTime());
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setDuration(`${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`);
    };

    // Update immediately
    updateDuration();

    // Only update in real-time if session is running and not ended
    if (status === 'running' && !endTime) {
      const interval = setInterval(updateDuration, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime, endTime, status]);

  return (
    <div className="space-y-1">
      <div className="flex items-center text-sm font-medium text-gray-900">
        <Clock className="w-4 h-4 mr-1 text-gray-500" />
        {duration}
      </div>
      <div className="text-xs text-gray-500">
        Início: {startDateTime}
      </div>
    </div>
  );
}