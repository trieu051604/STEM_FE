import React from 'react';

// Mock data based on the provided image
const scheduleData = [
  {
    day: 'FRI',
    slot: 2,
    code: 'VNR202-',
    room: '324',
    status: 'absent',
    time: '9:30-11:45',
  },
  {
    day: 'WED',
    slot: 4,
    code: 'VNR202-',
    room: '311',
    status: 'attended',
    time: '15:00-17:15',
  },
  {
    day: 'WED',
    slot: 6,
    code: 'SEP490-',
    room: '309',
    status: 'attended',
    time: '20:00-22:15',
  },
];

const days = [
  { name: 'MON', date: '22/06' },
  { name: 'TUE', date: '23/06' },
  { name: 'WED', date: '24/06' },
  { name: 'THU', date: '25/06' },
  { name: 'FRI', date: '26/06' },
  { name: 'SAT', date: '27/06' },
  { name: 'SUN', date: '28/06' },
];

const slots = [1, 2, 3, 4, 5, 6, 7, 8];

export const MyClassesPage = () => {
  const getCellData = (dayName: string, slotNumber: number) => {
    return scheduleData.find(
      (item) => item.day === dayName && item.slot === slotNumber
    );
  };

  return (
    <div className="p-4 md:p-6 bg-white min-h-[calc(100vh-4rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0f4c5c] mb-2">Danh sách lớp phụ trách</h1>
        <p className="text-muted-foreground text-sm">Lịch dạy hàng tuần</p>
      </div>

      <div className="overflow-x-auto border border-border rounded-sm shadow-sm">
        <table className="w-full text-sm text-left border-collapse min-w-[800px]">
          <thead>
            <tr>
              <th className="w-[180px] bg-[#6b8cdb] text-white border-b border-r border-[#8fa8e5] align-top p-0">
                <div className="flex flex-col h-full border-b border-[#8fa8e5] last:border-0">
                  <div className="flex items-center">
                    <span className="bg-[#8ca5dc] px-2 py-1 text-xs font-semibold uppercase w-14 text-center border-r border-[#7b98e0]">Year</span>
                    <select className="bg-white text-black text-xs mx-1 px-1 py-0.5 rounded-sm outline-none">
                      <option>2026</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col h-full">
                  <div className="flex items-center bg-[#6b8cdb]">
                    <span className="bg-[#8ca5dc] px-2 py-1 text-xs font-semibold uppercase w-14 text-center border-r border-t border-[#7b98e0]">Week</span>
                    <select className="bg-white text-black text-xs mx-1 px-1 py-0.5 rounded-sm outline-none">
                      <option>22/06 To 28/06</option>
                    </select>
                  </div>
                </div>
              </th>
              {days.map((day) => (
                <th key={day.name} className="bg-[#6b8cdb] text-white border-b border-r border-[#8fa8e5] p-2 align-top font-normal min-w-[120px] last:border-r-0">
                  <div className="font-semibold">{day.name}</div>
                  <div className="text-xs opacity-90">{day.date}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot} className="border-b border-border last:border-0 hover:bg-slate-50/50">
                <td className="p-2 border-r border-border font-medium text-slate-700 bg-slate-50/50 align-top">
                  Slot {slot}
                </td>
                {days.map((day) => {
                  const data = getCellData(day.name, slot);
                  return (
                    <td key={`${day.name}-${slot}`} className="p-2 border-r border-border align-top last:border-r-0">
                      {data ? (
                        <div className="flex flex-col items-start gap-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-[#337ab7] font-semibold">{data.code}</span>
                            <button className="bg-[#f0ad4e] hover:bg-[#ec971f] text-white text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors uppercase">
                              View Materials
                            </button>
                          </div>
                          <div className="text-slate-600 text-[13px]">
                            at {data.room}
                          </div>
                          <div
                            className={cn(
                              "text-[13px] font-semibold",
                              data.status === 'attended' ? 'text-[#5cb85c]' : 'text-[#d9534f]'
                            )}
                          >
                            ({data.status})
                          </div>
                          <div className="bg-[#5cb85c] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-sm inline-block">
                            ({data.time})
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-sm text-slate-700">
        <p className="font-semibold underline mb-2">More note / Chú thích thêm:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <span className="text-[#5cb85c] font-semibold">(attended)</span>: TrieuLQQE180029 had attended this activity / Lê Quốc Triệu đã tham gia hoạt động này
          </li>
          <li>
            <span className="text-[#d9534f] font-semibold">(absent)</span>: TrieuLQQE180029 had NOT attended this activity / Lê Quốc Triệu đã vắng mặt buổi này
          </li>
          <li>
            <span className="font-semibold">(-)</span>: no data was given / chưa có dữ liệu
          </li>
        </ul>
      </div>
    </div>
  );
};

// Simple utility function just in case `cn` is not available in scope
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
