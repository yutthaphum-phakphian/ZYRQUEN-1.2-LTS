import React, { useEffect, useState } from 'react';

interface TimeZoneInfo {
  name: string;
  timezone: string;
  offset: string;
}

const TIMEZONES: TimeZoneInfo[] = [
  { name: 'New York', timezone: 'America/New_York', offset: 'UTC-5' },
  { name: 'London', timezone: 'Europe/London', offset: 'UTC+0' },
  { name: 'Paris', timezone: 'Europe/Paris', offset: 'UTC+1' },
  { name: 'Tokyo', timezone: 'Asia/Tokyo', offset: 'UTC+9' },
  { name: 'Sydney', timezone: 'Australia/Sydney', offset: 'UTC+10' },
  { name: 'Dubai', timezone: 'Asia/Dubai', offset: 'UTC+4' },
  { name: 'Singapore', timezone: 'Asia/Singapore', offset: 'UTC+8' },
  { name: 'São Paulo', timezone: 'America/Sao_Paulo', offset: 'UTC-3' },
];

interface ClockState {
  [timezone: string]: string;
}

const MultiTimezoneClock: React.FC = () => {
  const [times, setTimes] = useState<ClockState>({});
  const [is24Hour, setIs24Hour] = useState(true);

  useEffect(() => {
    const updateTimes = () => {
      const newTimes: ClockState = {};
      
      TIMEZONES.forEach(({ timezone }) => {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: !is24Hour,
        });
        
        newTimes[timezone] = formatter.format(now);
      });
      
      setTimes(newTimes);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);

    return () => clearInterval(interval);
  }, [is24Hour]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-2">Global Time Clock</h1>
          <p className="text-slate-300 text-lg">Current time across different time zones</p>
        </div>

        {/* Toggle Button */}
        <div className="flex justify-center mb-12">
          <button
            onClick={() => setIs24Hour(!is24Hour)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-200"
          >
            {is24Hour ? '24-Hour Format' : '12-Hour Format'}
          </button>
        </div>

        {/* Clock Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TIMEZONES.map(({ name, timezone, offset }) => (
            <div
              key={timezone}
              className="bg-slate-700 rounded-lg p-6 shadow-lg hover:shadow-2xl transition duration-300 border border-slate-600"
            >
              {/* City Name */}
              <h2 className="text-2xl font-bold text-white mb-2">{name}</h2>
              
              {/* Timezone Info */}
              <p className="text-slate-400 text-sm mb-4">
                {timezone} • {offset}
              </p>
              
              {/* Digital Time Display */}
              <div className="bg-slate-900 rounded p-4 text-center font-mono">
                <div className="text-4xl font-bold text-green-400 tracking-wider">
                  {times[timezone] || '--:--:--'}
                </div>
              </div>
              
              {/* Date */}
              <p className="text-slate-400 text-center text-sm mt-4">
                {new Date(new Date().toLocaleString('en-US', { timeZone: timezone })).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-slate-400">
          <p>Updates every second • Auto-adjusts for DST</p>
        </div>
      </div>
    </div>
  );
};

export default MultiTimezoneClock;
