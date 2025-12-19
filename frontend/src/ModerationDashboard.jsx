import React, { useState, useEffect } from 'react';
import './ModerationDashboard.css';

const API_BASE = 'https://g4yp1g.ngrok.app/api';

function ModerationDashboard() {
  const [groups, setGroups] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedGroup, setSelectedGroup] = useState('');
  const [groupSettings, setGroupSettings] = useState({});

  useEffect(() => {
    fetchGroups();
    const interval = setInterval(fetchGroups, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchGroups = async () => {
    const res = await fetch(`${API_BASE}/groups`);
    const data = await res.json();
    setGroups(data);
    if (data.length > 0 && !selectedGroup) {
      setSelectedGroup(data[0].id);
    }
  };

  const fetchStats = async () => {
    const res = await fetch(`${API_BASE}/stats`);
    setStats(await res.json());
  };

  const updateGroupSettings = async (settings) => {
    await fetch(`${API_BASE}/groups/${selectedGroup}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    fetchGroups();
  };

  const toggleSpamFilter = () => {
    const newSettings = { ...groupSettings, enableSpamFilter: !groupSettings.enableSpamFilter };
    setGroupSettings(newSettings);
    updateGroupSettings(newSettings);
  };

  const toggleModeration = () => {
    const newSettings = { ...groupSettings, enableModeration: !groupSettings.enableModeration };
    setGroupSettings(newSettings);
    updateGroupSettings(newSettings);
  };

  useEffect(() => {
    if (selectedGroup) {
      const group = groups.find(g => g.id === selectedGroup);
      if (group) setGroupSettings(group);
    }
  }, [groups, selectedGroup]);

  if (groups.length === 0) {
    return <div className="loading">🚀 Waiting for groups...</div>;
  }

  return (
    <div className="dashboard">
      <header>
        <h1>🛡️ G4yp1g Moderation Dashboard</h1>
        <div className="stats">
          Groups: {groups.length} | Messages: {stats.messageCount || 0} | Active: {stats.activeUsers || 0}
        </div>
      </header>

      <div className="content">
        <div className="group-selector">
          <select 
            value={selectedGroup} 
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.id}</option>
            ))}
          </select>
        </div>

        {selectedGroup && (
          <div className="controls">
            <h3>Controls for {selectedGroup}</h3>
            
            <div className="toggle-group">
              <label>
                <input
                  type="checkbox"
                  checked={groupSettings.enableSpamFilter || false}
                  onChange={toggleSpamFilter}
                />
                Spam Filter
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={groupSettings.enableModeration || false}
                  onChange={toggleModeration}
                />
                Banned Words
              </label>
            </div>

            <div className="banned-words">
              <h4>Banned Words:</h4>
              <ul>
                {(groupSettings.bannedWords || []).map((word, i) => (
                  <li key={i}>{word}</li>
                ))}
              </ul>
            </div>

            <div className="logs">
              <h4>Recent Actions:</h4>
              <pre>{JSON.stringify(groupSettings.spamLog?.slice(-3), null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ModerationDashboard;
