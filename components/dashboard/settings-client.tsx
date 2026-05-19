"use client";

import { useState } from "react";
import type { ConnectedAccount, UserProfile } from "@/lib/types";
import { Panel, ScreenHeader } from "@/components/ui/primitives";

export function SettingsClient({
  profile,
  connectedAccounts
}: {
  profile: UserProfile;
  connectedAccounts: ConnectedAccount[];
}) {
  const [connections, setConnections] = useState(connectedAccounts);

  function toggleConnection(id: string) {
    setConnections((items) => items.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)));
  }

  return (
    <>
      <ScreenHeader title="Settings" copy="Profile and connected accounts for the signed-in user." />
      <section className="settings-grid">
        <article className="settings-panel profile-card">
          <span className="avatar">{profile.initials}</span>
          <div>
            <h2 className="panel-title">{profile.name}</h2>
            <p>{profile.email}</p>
          </div>
          <button className="btn secondary" type="button">Change photo</button>
        </article>

        <div className="stack">
          <Panel title="Profile" description="Basic details shown across the dashboard.">
            <form className="form-grid">
              <label>Display name<input className="field-input" defaultValue={profile.name} /></label>
              <label>Email<input className="field-input" defaultValue={profile.email} /></label>
              <label>Home currency<select className="select-input" defaultValue={profile.homeCurrency}><option>GBP</option><option>USD</option><option>EUR</option></select></label>
              <label>Week starts<select className="select-input" defaultValue={profile.weekStartsOn}><option>Monday</option><option>Sunday</option></select></label>
            </form>
          </Panel>

          <Panel title="Connected accounts" description="Personal integrations feeding calendar and finance views." action={<button className="btn secondary" type="button">Connect</button>}>
            <div className="list">
              {connections.map((connection) => (
                <div className="setting-row" key={connection.id}>
                  <div>
                    <strong>{connection.name}</strong>
                    <span>{connection.description}</span>
                  </div>
                  <button
                    aria-label={`Toggle ${connection.name}`}
                    aria-pressed={connection.enabled}
                    className={`toggle${connection.enabled ? " is-on" : ""}`}
                    type="button"
                    onClick={() => toggleConnection(connection.id)}
                  />
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </section>
    </>
  );
}
