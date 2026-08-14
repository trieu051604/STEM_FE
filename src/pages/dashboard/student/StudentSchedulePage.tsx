import { useState } from 'react';
import { WeeklyScheduleGrid } from '@/components/WeeklyScheduleGrid';

export default function StudentSchedulePage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Lịch học</h1>
        <p className="text-muted-foreground">Xem lịch học của bạn</p>
      </div>

      {/* Weekly Schedule Grid - Student View */}
      <WeeklyScheduleGrid
        isStudentView={true}
        isAdmin={false}
        onScheduleChange={() => setRefreshKey(k => k + 1)}
        key={refreshKey}
      />
    </div>
  );
}
