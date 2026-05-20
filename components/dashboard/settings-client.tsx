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
  const appleCalendar = connections.find((connection) => connection.provider === "apple_calendar");
  const [appleCalendarUrl, setAppleCalendarUrl] = useState(
    typeof appleCalendar?.publicConfig?.ical_url === "string" ? appleCalendar.publicConfig.ical_url : ""
  );
  const [integrationStatus, setIntegrationStatus] = useState("");
  const [isSavingIntegration, setIsSavingIntegration] = useState(false);

  function toggleConnection(id: string) {
    setConnections((items) => items.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)));
  }

  async function saveAppleCalendar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingIntegration(true);
    setIntegrationStatus("");

    const response = await fetch("/api/integrations/apple-calendar", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        displayName: "Apple Calendar",
        icalUrl: appleCalendarUrl
      })
    });
    const payload = await response.json().catch(() => ({}));
    setIsSavingIntegration(false);

    if (!response.ok) {
      setIntegrationStatus(typeof payload.error === "string" ? payload.error : "Could not save Apple Calendar.");
      return;
    }

    setIntegrationStatus("Apple Calendar saved for this user.");
    setConnections((items) =>
      items.map((item) =>
        item.provider === "apple_calendar"
          ? {
              ...item,
              enabled: true,
              status: "connected",
              accessMode: "public_ical",
              publicConfig: { ical_url: appleCalendarUrl }
            }
          : item
      )
    );
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

          <Panel title="Apple Calendar" description="Saved per user. Public iCloud links are stored as user config; private CalDAV credentials should use Supabase Vault.">
            <form className="integration-form" onSubmit={saveAppleCalendar}>
              <label>
                iCloud calendar URL
                <input
                  className="field-input"
                  placeholder="webcal://..."
                  value={appleCalendarUrl}
                  onChange={(event) => setAppleCalendarUrl(event.target.value)}
                />
              </label>
              <button className="btn" type="submit" disabled={isSavingIntegration}>
                {isSavingIntegration ? "Saving..." : "Save Apple Calendar"}
              </button>
              {integrationStatus ? <p className="auth-status">{integrationStatus}</p> : null}
            </form>
          </Panel>

          <Panel title="Connected accounts" description="User-specific integrations feeding calendar and finance views." action={<button className="btn secondary" type="button">Connect</button>}>
            <div className="list">
              {connections.map((connection) => (
                <div className="setting-row" key={connection.id}>
                  <div>
                    <strong>{connection.name}</strong>
                    <span>{connection.description} · {connection.status}</span>
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
